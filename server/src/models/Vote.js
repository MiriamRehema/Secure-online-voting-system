const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  token: { type: String, required: true },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vote", voteSchema);
