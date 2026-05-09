const express = require("express");
const cors = require("cors");
const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/student", require("./routes/students.route"));
app.use("/api/candidates", require("./routes/candidates.route"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/vote", require("./routes/vote.routes"));

app.get("/", (req, res) => {
  res.json({ message: "Secure Online Voting System API is running" });
});

module.exports = app;