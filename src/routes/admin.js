const express = require("express");
const { body, validationResult } = require("express-validator");
const Campaign = require("../models/Campaign");
const Donation = require("../models/Donation");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("superadmin", "moderator"));

router.get("/campaigns/pending", async (req, res) => {
  const campaigns = await Campaign.find({ status: "pending" })
    .populate("creator", "name email")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ campaigns });
});

router.patch(
  "/campaigns/:id/status",
  [body("status").isIn(["active", "rejected", "blocked", "completed"])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const c = await Campaign.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!c) return res.status(404).json({ message: "Not found" });
    res.json({ campaign: c });
  }
);

router.patch(
  "/campaigns/:id",
  [
    body("title").optional().trim().notEmpty(),
    body("description").optional().trim().notEmpty(),
    body("goalAmount").optional().isFloat({ min: 1 }),
    body("category").optional().isIn(["education", "health", "environment", "community", "other"]),
    body("deadline").optional().isISO8601(),
    body("featured").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const c = await Campaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Not found" });
    const allowed = ["title", "description", "goalAmount", "category", "deadline", "featured"];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if (k === "deadline") c.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
        else c[k] = req.body[k];
      }
    }
    await c.save();
    res.json({ campaign: c });
  }
);

// Staff create campaign (popup)
router.post(
  "/campaigns",
  [
    body("title").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("goalAmount").isFloat({ min: 1 }),
    body("category").optional().isIn(["education", "health", "environment", "community", "other"]),
    body("deadline").optional().isISO8601(),
    body("status").optional().isIn(["pending", "active", "completed", "rejected", "blocked"]),
    body("mediaUrl").optional().trim().isLength({ min: 1, max: 5000 }),
    body("featured").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, goalAmount, category, deadline, status, mediaUrl, featured } = req.body;
    const media = [];
    if (mediaUrl) media.push(mediaUrl);

    const campaign = await Campaign.create({
      title,
      description,
      goalAmount,
      category: category || "other",
      deadline: deadline ? new Date(deadline) : undefined,
      status: status || "pending",
      media,
      featured: featured ?? false,
      creator: req.user._id,
    });

    res.status(201).json({ campaign });
  }
);

router.delete("/campaigns/:id", requireRole("superadmin"), async (req, res) => {
  await Campaign.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get("/donations", async (req, res) => {
  const donations = await Donation.find()
    .populate("user", "name email")
    .populate("campaign", "title")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json({ donations });
});

router.patch(
  "/donations/:id/status",
  [body("status").isIn(["pending", "completed", "failed", "refunded"])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const d = await Donation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!d) return res.status(404).json({ message: "Not found" });
    res.json({ donation: d });
  }
);

router.get("/analytics/summary", async (req, res) => {
  const [agg] = await Donation.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: null,
        totalRaised: { $sum: "$amount" },
        totalNet: { $sum: "$netToCampaign" },
        totalFees: { $sum: "$platformFee" },
        count: { $sum: 1 },
      },
    },
  ]);
  const topCampaigns = await Campaign.find({ status: { $in: ["active", "completed"] } })
    .sort({ raisedAmount: -1 })
    .limit(5)
    .select("title raisedAmount goalAmount donorCount")
    .lean();
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthly = await Donation.aggregate([
    { $match: { status: "completed", createdAt: { $gte: startMonth } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  res.json({
    lifetime: agg || { totalRaised: 0, totalNet: 0, totalFees: 0, count: 0 },
    thisMonth: monthly[0]?.total || 0,
    topCampaigns,
  });
});

// Data for the dashboard overview UI (cards + charts)
router.get("/analytics/dashboard", async (req, res) => {
  const [registeredUsers, activeCampaignsCount, totalDonorsAgg, totalRaisedAgg] = await Promise.all([
    User.countDocuments({ blocked: { $ne: true } }),
    Campaign.countDocuments({ status: "active" }),
    Campaign.aggregate([{ $match: { status: { $in: ["active", "completed"] } } }, { $group: { _id: null, total: { $sum: "$donorCount" } } }]),
    Donation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalRaised: { $sum: "$amount" } } },
    ]),
  ]);

  const totalDonors = totalDonorsAgg[0]?.total || 0;
  const totalRaised = totalRaisedAgg[0]?.totalRaised || 0;

  const start = new Date(Date.now() - 30 * 86400000);
  const monthlyDonations = await Donation.aggregate([
    { $match: { status: "completed", createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%b %d", date: "$createdAt" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  // Pie data by category (use totals of raisedAmount)
  const categoryTotals = await Campaign.aggregate([
    { $match: { status: { $in: ["active", "completed"] } } },
    { $group: { _id: "$category", totalRaised: { $sum: "$raisedAmount" }, campaigns: { $sum: 1 } } },
  ]);

  res.json({
    cards: {
      totalRaised,
      activeCampaigns: activeCampaignsCount,
      totalDonors,
      registeredUsers,
    },
    monthlyDonationsByDay: monthlyDonations.map((d) => ({ day: d._id, total: d.total })),
    categoryTotals: categoryTotals.map((c) => ({ category: c._id, totalRaised: c.totalRaised, campaigns: c.campaigns })),
  });
});

router.get("/settings", requireRole("superadmin"), (req, res) => {
  res.json({
    platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || "2", 10),
    razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    paypalConfigured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    branding: { name: "CrowdConnect", tagline: "Fund social impact together" },
  });
});

module.exports = router;
