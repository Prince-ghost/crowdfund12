const dns = require("dns");
const mongoose = require("mongoose");

/** Support both names so old .env entries still work */
const uri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/crowdconnect";

const mongoOptions = {
  serverSelectionTimeoutMS: 20_000,
  maxPoolSize: 10,
};

/**
 * Windows / some ISPs block or mishandle SRV lookups for mongodb+srv://
 * → querySrv ECONNREFUSED. Set MONGODB_ATLAS_PUBLIC_DNS=1 in .env to use Google DNS for Node only.
 */
function usePublicDnsForSrvIfConfigured() {
  if (process.env.MONGODB_ATLAS_PUBLIC_DNS !== "1") return;
  if (!uri.includes("mongodb+srv")) return;
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("MongoDB: using public DNS (8.8.8.8) for Atlas SRV — MONGODB_ATLAS_PUBLIC_DNS=1");
}

async function connectDB() {
  usePublicDnsForSrvIfConfigured();
  try {
    await mongoose.connect(uri, mongoOptions);
    console.log("MongoDB connected:", mongoose.connection.host);
  } catch (e) {
    console.error("MongoDB connection failed:", e.message);
    if (uri.includes("mongodb+srv")) {
      console.error(
        "Atlas checklist: (1) .env must use MONGODB_URI=... (not only MONGO_URI). (2) Network Access → your IP allowed. (3) Password has @ # ? etc. → URL-encode in URI."
      );
      console.error(
        "If error is querySrv ECONNREFUSED: add MONGODB_ATLAS_PUBLIC_DNS=1 to .env, run ipconfig /flushdns, or in Atlas use standard mongodb://… connection string (not srv)."
      );
    }
    process.exit(1);
  }
}

connectDB.mongoOptions = mongoOptions;
connectDB.usePublicDnsForSrvIfConfigured = usePublicDnsForSrvIfConfigured;
module.exports = connectDB;
