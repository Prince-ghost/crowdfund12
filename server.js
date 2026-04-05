require("dotenv").config();
const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/auth");
const campaignRoutes = require("./src/routes/campaigns");
const donationRoutes = require("./src/routes/donations");
const couponRoutes = require("./src/routes/coupons");
const adminRoutes = require("./src/routes/admin");
const supportRoutes = require("./src/routes/support");
const userRoutes = require("./src/routes/users");

const app = express();
const basePort = parseInt(process.env.PORT || "3000", 10);

connectDB();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/users", userRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

function listenOnPort(port, attemptsLeft) {
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`CrowdConnect running at http://localhost:${port}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.warn(`Port ${port} is already in use, trying ${port + 1}...`);
      server.close(() => listenOnPort(port + 1, attemptsLeft - 1));
    } else {
      console.error(err.message);
      if (err.code === "EADDRINUSE") {
        console.error("Stop the other app on this port, or set PORT in .env to a free port (e.g. PORT=3001).");
      }
      process.exit(1);
    }
  });
}

listenOnPort(basePort, 15);
