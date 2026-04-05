const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["user", "admin"], required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    category: { type: String, default: "general" },
    status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", ticketSchema);
