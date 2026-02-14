const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VotingSession",
  },
  used: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Token", tokenSchema);
