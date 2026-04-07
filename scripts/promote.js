/**
 * Promote a user to superadmin by name or email.
 * Usage: node scripts/promote.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const connectDB = require("../src/config/db");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/crowdconnect";

async function run() {
  connectDB.usePublicDnsForSrvIfConfigured();
  await mongoose.connect(uri, connectDB.mongoOptions);

  // Find user named "Prince" (case-insensitive) or first non-admin user
  let user = await User.findOne({ name: { $regex: /^prince$/i } });
  if (!user) {
    user = await User.findOne({ role: "user" });
  }

  if (!user) {
    console.log("No user found to promote.");
    await mongoose.disconnect();
    return;
  }

  user.role = "superadmin";
  await user.save();
  console.log(`✅ Promoted "${user.name}" (${user.email}) to superadmin`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
