const express = require("express");
const { body, validationResult } = require("express-validator");
const SupportTicket = require("../models/SupportTicket");
const FAQ = require("../models/FAQ");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/contact",
  [
    body("email").isEmail().normalizeEmail(),
    body("subject").trim().notEmpty(),
    body("message").trim().notEmpty(),
    body("name").optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const ticket = await SupportTicket.create({
      email: req.body.email,
      subject: req.body.subject,
      messages: [{ from: "user", text: req.body.message }],
    });
    res.status(201).json({ id: ticket._id, message: "We received your message." });
  }
);

router.get("/faq", async (req, res) => {
  const items = await FAQ.find().sort({ order: 1, createdAt: 1 }).lean();
  res.json({ faq: items });
});

router.post(
  "/tickets",
  requireAuth,
  [body("subject").trim().notEmpty(), body("message").trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const ticket = await SupportTicket.create({
      user: req.user._id,
      email: req.user.email,
      subject: req.body.subject,
      messages: [{ from: "user", text: req.body.message }],
    });
    res.status(201).json({ ticket });
  }
);

router.get("/tickets/mine", requireAuth, async (req, res) => {
  const list = await SupportTicket.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
  res.json({ tickets: list });
});

router.post(
  "/admin/tickets/:id/reply",
  requireAuth,
  requireRole("superadmin", "moderator"),
  [body("text").trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Not found" });
    ticket.messages.push({ from: "admin", text: req.body.text });
    ticket.status = "in_progress";
    await ticket.save();
    res.json({ ticket });
  }
);

router.get("/admin/tickets", requireAuth, requireRole("superadmin", "moderator"), async (req, res) => {
  const tickets = await SupportTicket.find().sort({ updatedAt: -1 }).limit(200).lean();
  res.json({ tickets });
});

router.post(
  "/admin/faq",
  requireAuth,
  requireRole("superadmin", "moderator"),
  [body("question").trim().notEmpty(), body("answer").trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const f = await FAQ.create(req.body);
    res.status(201).json({ faq: f });
  }
);

module.exports = router;
