const express = require("express");
const cors = require("cors");
const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://jkuat-online-voting-sysstem.netlify.app"
    ];
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith("--jkuat-online-voting-sysstem.netlify.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
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
