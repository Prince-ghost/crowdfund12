const express = require("express");
const { body, validationResult } = require("express-validator");
const Donation = require("../models/Donation");
const Campaign = require("../models/Campaign");
const Coupon = require("../models/Coupon");
const { requireAuth } = require("../middleware/auth");
const { processPayment, platformFeePercent } = require("../utils/payments");

const router = express.Router();

function applyCoupon(base, coupon) {
  if (!coupon || !coupon.active) return { final: base, discount: 0 };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { final: base, discount: 0 };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { final: base, discount: 0 };
  }
  let discount = 0;
  if (coupon.type === "flat") discount = Math.min(coupon.value, base);
  else discount = Math.min((base * coupon.value) / 100, base);
  return { final: Math.max(1, Math.round((base - discount) * 100) / 100), discount };
}

router.post(
  "/",
  requireAuth,
  [
    body("campaignId").isMongoId(),
    body("amount").isFloat({ min: 1 }),
    body("paymentMethod").isIn(["razorpay", "stripe", "paypal", "mock"]),
    body("couponCode").optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { campaignId, amount, paymentMethod, couponCode } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "active") {
      return res.status(400).json({ message: "Campaign not available for donations" });
    }

    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase() });
    }
    const { final, discount } = applyCoupon(amount, couponDoc);

    const feePct = platformFeePercent();
    const platformFee = Math.round(((final * feePct) / 100) * 100) / 100;
    const netToCampaign = Math.round((final - platformFee) * 100) / 100;

    const pay = await processPayment({
      method: paymentMethod,
      amount: final,
      currency: "INR",
    });
    if (!pay.ok) return res.status(402).json({ message: "Payment failed" });

    const donation = await Donation.create({
      user: req.user._id,
      campaign: campaign._id,
      amount: final,
      paymentMethod: pay.transactionId.startsWith("mock_") ? "mock" : paymentMethod,
      transactionId: pay.transactionId,
      status: "completed",
      couponCode: couponDoc ? couponDoc.code : undefined,
      discountAmount: discount,
      platformFee,
      netToCampaign,
    });

    campaign.raisedAmount = Math.round((campaign.raisedAmount + netToCampaign) * 100) / 100;
    campaign.donorCount += 1;
    if (campaign.raisedAmount >= campaign.goalAmount) campaign.status = "completed";
    await campaign.save();

    if (couponDoc && discount > 0) {
      couponDoc.usedCount += 1;
      await couponDoc.save();
    }

    res.status(201).json({
      donation,
      note: pay.note,
      campaign: {
        id: campaign._id,
        raisedAmount: campaign.raisedAmount,
        status: campaign.status,
      },
    });
  }
);

router.get("/mine", requireAuth, async (req, res) => {
  const list = await Donation.find({ user: req.user._id })
    .populate("campaign", "title media status")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ donations: list });
});

router.get("/:id/receipt", requireAuth, async (req, res) => {
  const d = await Donation.findById(req.params.id).populate("campaign", "title").populate("user", "name email");
  if (!d || d.user._id.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: "Not found" });
  }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="receipt-${d.transactionId}.txt"`);
  res.send(
    [
      "CrowdConnect — Donation Receipt",
      "-------------------------------",
      `Transaction ID: ${d.transactionId}`,
      `Date: ${d.createdAt.toISOString()}`,
      `Donor: ${d.user.name} <${d.user.email}>`,
      `Campaign: ${d.campaign.title}`,
      `Amount: ${d.amount} ${d.currency}`,
      `Status: ${d.status}`,
      `Payment: ${d.paymentMethod}`,
      "",
      "Thank you for supporting a social cause.",
    ].join("\n")
  );
});

module.exports = router;
