const mongoose = require("mongoose");
const voteSchema = new mongoose.Schema({
  token: { type: String, required: true },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
  }
});
module.exports = mongoose.model("Vote", voteSchema);
