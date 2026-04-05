const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "stripe", "paypal", "mock"],
      default: "mock",
    },
    transactionId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    netToCampaign: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
