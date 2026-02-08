//created the Express App,adds middlewares,register routes
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Import routes
const candidateRoutes = require("./routes/candidates.route");

// Use routes
app.use("/api/candidates", candidateRoutes);

// Test route (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.json({
    message: "Secure Online Voting System API is running",
  });
});
module.exports = app;