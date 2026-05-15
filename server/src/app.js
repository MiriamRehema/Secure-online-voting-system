const express = require("express");
const cors = require("cors");
const app = express();

origin: [
  "http://localhost:3000",
  "https://jkuat-online-voting-sysstem.netlify.app",
  "https://6a06d819caf9efe169a7a6a6--jkuat-online-voting-sysstem.netlify.app"
],
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
