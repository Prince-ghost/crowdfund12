const express = require("express");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const User = require("../models/User");
const { signToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .trim()
      .normalizeEmail({ gmail_remove_dots: false })
      .isEmail()
      .withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { name, email, password } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: "Email already registered" });
      const user = await User.create({ name, email, password });
      const token = signToken(user._id);
      res.status(201).json({ token, user: user.toPublicJSON() });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(400).json({ message: "Email already registered" });
      }
      console.error("signup", e);
      res.status(500).json({ message: e.message || "Could not create account" });
    }
  }
);

router.post(
  "/login",
  [
    body("email").trim().normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || user.blocked) return res.status(401).json({ message: "Invalid credentials" });
      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });
      const token = signToken(user._id);
      res.json({ token, user: user.toPublicJSON() });
    } catch (e) {
      console.error("login", e);
      res.status(500).json({ message: e.message || "Login failed" });
    }
  }
);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

router.patch(
  "/profile",
  requireAuth,
  [body("name").optional().trim().notEmpty(), body("email").optional().isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email } = req.body;
    if (name) req.user.name = name;
    if (email) {
      const taken = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ message: "Email in use" });
      req.user.email = email;
    }
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  }
);

router.post(
  "/change-password",
  requireAuth,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { currentPassword, newPassword } = req.body;
    const ok = await req.user.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Current password incorrect" });
    req.user.password = newPassword;
    await req.user.save();
    res.json({ message: "Password updated" });
  }
);

/** Dev-friendly reset: stores token on user; in production send email with link */
router.post("/forgot-password", [body("email").isEmail().normalizeEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.json({ message: "If an account exists, reset instructions were sent." });
  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  res.json({
    message: "If an account exists, reset instructions were sent.",
    devToken: process.env.NODE_ENV === "production" ? undefined : token,
  });
});

router.post(
  "/reset-password",
  [body("email").isEmail(), body("token").notEmpty(), body("newPassword").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, token, newPassword } = req.body;
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: "Password reset successful" });
  }
);

module.exports = router;
