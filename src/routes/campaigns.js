const express = require("express");
const { body, query, validationResult } = require("express-validator");
const Campaign = require("../models/Campaign");
const { requireAuth, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get(
  "/",
  [
    query("category").optional().isIn(["education", "health", "environment", "community", "other", ""]),
    query("status").optional().isIn(["active", "completed", "pending", ""]),
    query("sort").optional().isIn(["popular", "urgent", "newest", ""]),
    query("search").optional().trim(),
  ],
  async (req, res) => {
    const { category, status, sort, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = { $in: ["active", "completed"] };
    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }
    let q = Campaign.find(filter).populate("creator", "name email");
    if (sort === "popular") q = q.sort({ donorCount: -1, raisedAmount: -1 });
    else if (sort === "urgent") q = q.sort({ deadline: 1 });
    else q = q.sort({ createdAt: -1 });
    const list = await q.lean();
    res.json({ campaigns: list });
  }
);

router.get("/featured", async (req, res) => {
  const campaigns = await Campaign.find({ featured: true, status: "active" })
    .populate("creator", "name")
    .limit(6)
    .lean();
  res.json({ campaigns });
});

router.get("/:id", async (req, res) => {
  const c = await Campaign.findById(req.params.id)
    .populate("creator", "name email")
    .populate("comments.user", "name")
    .lean();
  if (!c) return res.status(404).json({ message: "Campaign not found" });
  const related = await Campaign.find({
    _id: { $ne: c._id },
    category: c.category,
    status: "active",
  })
    .limit(4)
    .select("title raisedAmount goalAmount media category")
    .lean();
  res.json({ campaign: c, related });
});

router.post(
  "/",
  requireAuth,
  [
    body("title").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("goalAmount").isFloat({ min: 1 }),
    body("category").optional().isIn(["education", "health", "environment", "community", "other"]),
    body("deadline").optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { title, description, goalAmount, category, deadline } = req.body;
    const campaign = await Campaign.create({
      title,
      description,
      goalAmount,
      category: category || "other",
      deadline: deadline ? new Date(deadline) : undefined,
      creator: req.user._id,
      status: "pending",
    });
    res.status(201).json({ campaign });
  }
);

router.post("/:id/media", requireAuth, upload.array("files", 5), async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: "Not found" });
  if (campaign.creator.toString() !== req.user._id.toString() && req.user.role === "user") {
    return res.status(403).json({ message: "Forbidden" });
  }
  const paths = (req.files || []).map((f) => `/uploads/${f.filename}`);
  campaign.media.push(...paths);
  await campaign.save();
  res.json({ media: campaign.media });
});

router.post(
  "/:id/updates",
  requireAuth,
  [body("title").trim().notEmpty(), body("body").trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Not found" });
    const isCreator = campaign.creator.toString() === req.user._id.toString();
    const isStaff = req.user.role === "moderator" || req.user.role === "superadmin";
    if (!isCreator && !isStaff) return res.status(403).json({ message: "Forbidden" });
    campaign.updates.push({ title: req.body.title, body: req.body.body });
    await campaign.save();
    res.status(201).json({ updates: campaign.updates });
  }
);

router.post(
  "/:id/comments",
  requireAuth,
  [body("text").trim().notEmpty().isLength({ max: 2000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign || campaign.status !== "active") {
      return res.status(404).json({ message: "Campaign not available" });
    }
    campaign.comments.push({ user: req.user._id, text: req.body.text });
    await campaign.save();
    const updated = await Campaign.findById(campaign._id)
      .populate("comments.user", "name")
      .select("comments")
      .lean();
    res.status(201).json({ comments: updated.comments });
  }
);

module.exports = router;
