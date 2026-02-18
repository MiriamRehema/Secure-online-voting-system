const express = require("express");
const router = express.Router();

const Token = require("../models/Token");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");

// ==============================
// CAST VOTE
// ==============================
router.post("/", async (req, res) => {
  const { token, candidateId } = req.body;

  if (!token || !candidateId)
    return res.status(400).json({ message: "Token and candidate required" });

  try {
    const tokenDoc = await Token.findOne({ token });

    if (!tokenDoc)
      return res.status(403).json({ message: "Invalid token" });

    if (tokenDoc.used)
      return res.status(403).json({ message: "Token already used" });

    const candidate = await Candidate.findById(candidateId);
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    // Record vote
    await Vote.create({
      token: tokenDoc.token,
      candidateId,
    });

    // Increment vote count
    candidate.votes += 1;
    await candidate.save();

    // Mark token as used
    tokenDoc.used = true;
    await tokenDoc.save();

    return res.status(200).json({
      message: "Vote cast successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
