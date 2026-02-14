const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/students", require("./routes/students.routes"));
app.use("/api/candidates", require("./routes/candidates.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/votes", require("./routes/vote.routes"));
app.use("/api/auth", require("./routes/auth.routes"));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Secure Online Voting System API is running" });
});

module.exports = app;
