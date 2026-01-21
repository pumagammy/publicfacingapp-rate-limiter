require("dotenv").config();
const express = require("express");
const routes = require("./routes");
const tokenBucketLimiter = require("./middleware/tokenBucketLimiter");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Apply rate limiter globally (uses dynamic policy based on tier/endpoint)
app.use(tokenBucketLimiter());

// Routes
app.use("/", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
  console.log(`Rate limiting: 10 requests per second per IP/API key`);
});

