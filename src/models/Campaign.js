const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema(
  {
    title: String,
    body: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["education", "health", "environment", "community", "other"],
      default: "other",
    },
    goalAmount: { type: Number, required: true, min: 1 },
    raisedAmount: { type: Number, default: 0, min: 0 },
    donorCount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "rejected", "blocked"],
      default: "pending",
    },
    media: [{ type: String }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updates: [updateSchema],
    comments: [commentSchema],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);
