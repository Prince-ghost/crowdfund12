const express = require("express");
const { body, validationResult } = require("express-validator");
const Coupon = require("../models/Coupon");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/validate", [body("code").trim().notEmpty(), body("amount").isFloat({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const code = req.body.code.toUpperCase();
  const amount = req.body.amount;
  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.active) return res.json({ valid: false });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.json({ valid: false, message: "Expired" });
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return res.json({ valid: false, message: "Usage limit reached" });
  }
  let discount = 0;
  if (coupon.type === "flat") discount = Math.min(coupon.value, amount);
  else discount = Math.min((amount * coupon.value) / 100, amount);
  const final = Math.max(1, Math.round((amount - discount) * 100) / 100);
  res.json({ valid: true, discount, finalAmount: final, type: coupon.type });
});

router.post(
  "/",
  requireAuth,
  requireRole("superadmin", "moderator"),
  [
    body("code").trim().notEmpty(),
    body("type").isIn(["flat", "percent"]),
    body("value").isFloat({ min: 0 }),
    body("expiresAt").optional().isISO8601(),
    body("usageLimit").optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { code, type, value, expiresAt, usageLimit } = req.body;
    try {
      const c = await Coupon.create({
        code: code.toUpperCase(),
        type,
        value,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        usageLimit: usageLimit ?? null,
      });
      res.status(201).json({ coupon: c });
    } catch (e) {
      if (e.code === 11000) return res.status(400).json({ message: "Code already exists" });
      throw e;
    }
  }
);

module.exports = router;
