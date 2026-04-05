const express = require("express");
const User = require("../models/User");
const Donation = require("../models/Donation");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole("superadmin", "moderator"), async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 }).limit(500).lean();
  res.json({ users });
});

router.patch("/:id/block", requireAuth, requireRole("superadmin", "moderator"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  if (user.role !== "user") return res.status(400).json({ message: "Cannot block staff" });
  user.blocked = !user.blocked;
  await user.save();
  res.json({ user: user.toPublicJSON() });
});

router.get("/:id/donations", requireAuth, requireRole("superadmin", "moderator"), async (req, res) => {
  const list = await Donation.find({ user: req.params.id })
    .populate("campaign", "title")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ donations: list });
});

module.exports = router;
