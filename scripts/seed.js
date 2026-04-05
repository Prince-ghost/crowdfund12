/**
 * Seed demo data: admin user + sample campaigns.
 * Run: node scripts/seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Campaign = require("../src/models/Campaign");
const FAQ = require("../src/models/FAQ");
const Coupon = require("../src/models/Coupon");

const connectDB = require("../src/config/db");
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/crowdconnect";

async function run() {
  connectDB.usePublicDnsForSrvIfConfigured();
  await mongoose.connect(uri, connectDB.mongoOptions);
  await User.deleteMany({ email: "admin@crowdconnect.local" });
  const admin = await User.create({
    name: "Super Admin",
    email: "admin@crowdconnect.local",
    password: "admin123",
    role: "superadmin",
  });

  const count = await Campaign.countDocuments();
  if (count === 0) {
    const creator = admin._id;
    const deadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    await Campaign.insertMany([
      {
        title: "Rural School Digital Classroom",
        description:
          "Social initiatives often struggle with fragmented funding. This project equips a rural school with tablets, internet, and teacher training so children can access quality learning regardless of location.",
        category: "education",
        goalAmount: 250000,
        raisedAmount: 62000,
        donorCount: 142,
        deadline,
        status: "active",
        creator,
        featured: true,
        updates: [
          { title: "Phase 1 complete", body: "We installed the first 20 tablets and held a workshop for teachers." },
        ],
      },
      {
        title: "Clean Water for Coastal Villages",
        description:
          "Community-led initiative to install filtration units and train local maintenance teams. Connect donors directly with measurable health outcomes.",
        category: "health",
        goalAmount: 500000,
        raisedAmount: 180000,
        donorCount: 89,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "active",
        creator,
        featured: true,
      },
      {
        title: "Urban Tree Canopy Restoration",
        description:
          "Planting native species in underserved neighborhoods to reduce heat and improve air quality. Volunteers and donors work together for the environment.",
        category: "environment",
        goalAmount: 120000,
        raisedAmount: 120000,
        donorCount: 256,
        status: "completed",
        creator,
      },
    ]);
  }

  await Coupon.updateOne(
    { code: "WELCOME5" },
    {
      $setOnInsert: { code: "WELCOME5", type: "percent", value: 5, usageLimit: 1000, usedCount: 0, active: true },
    },
    { upsert: true }
  );

  const faqCount = await FAQ.countDocuments();
  if (faqCount === 0) {
    await FAQ.insertMany([
      {
        question: "How does CrowdConnect work?",
        answer:
          "Creators submit social projects; after review, campaigns go live. Donors choose causes, pay securely, and receive receipts. Funds support verified project goals.",
        order: 1,
      },
      {
        question: "Is my donation secure?",
        answer:
          "We use industry-standard authentication and integrate with trusted payment providers. Always check for HTTPS and never share your password.",
        order: 2,
      },
    ]);
  }

  console.log("Seed done. Admin login: admin@crowdconnect.local / admin123");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
