const express = require("express");
const router = express.Router();

// Home endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to Rate Limiter API 🚀",
    endpoints: {
      status: "GET /api/status",
      data: "GET /api/data",
      health: "GET /api/health"
    }
  });
});

// Status endpoint
router.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Server is running"
  });
});

// Data endpoint
router.get("/api/data", (req, res) => {
  res.json({
    data: [
      { id: 1, name: "Item 1", value: 100 },
      { id: 2, name: "Item 2", value: 200 },
      { id: 3, name: "Item 3", value: 300 }
    ]
  });
});

// Health check endpoint
router.get("/api/health", (req, res) => {
  res.json({
    health: "healthy",
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

module.exports = router;
