const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Import Routes
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const aiRoutes = require("./routes/ai");
const executeRoutes = require("./routes/execute");
const analyticsRoutes = require("./routes/analytics");
const progressRoutes = require("./routes/progress");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/progress", progressRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "CodeNest API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CodeNest Server running on port ${PORT}`);
});
