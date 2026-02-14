const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Token = require("../models/Token");
const Candidate = require("../models/Candidate");
const Student = require("../models/Student");
const Vote = require("../models/Vote");
const VotingSession = require("../models/VotingSession");


// ==============================
// GENERATE TOKEN
// ==============================
router.post("/generate-token", async (req, res) => {
  try {
    const { studentId } = req.body;

    const session = await VotingSession.findOne({ isActive: true });
    if (!session)
      return res.status(400).json({ message: "No active voting session" });

    const now = new Date();
    if (now < session.startTime || now > session.endTime)
      return res.status(403).json({ message: "Voting session not active" });

    const student = await Student.findById(studentId);
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    if (student.hasVoted)
      return res.status(403).json({ message: "Already voted" });

    const existingToken = await Token.findOne({
      studentId,
      sessionId: session._id,
    });

    if (existingToken)
      return res.status(403).json({ message: "Token already generated" });

    const tokenString = crypto.randomBytes(32).toString("hex");

    const token = new Token({
      token: tokenString,
      studentId,
      sessionId: session._id,
    });

    await token.save();

    res.json({ token: tokenString });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ==============================
// CAST VOTE
// ==============================
router.post("/cast-vote", async (req, res) => {
  try {
    const { token, candidateId } = req.body;

    const existingToken = await Token.findOne({ token, used: false });

    if (!existingToken)
      return res.status(403).json({ message: "Invalid or used token" });

    // 🔥 CHECK SESSION AGAIN
    const session = await VotingSession.findById(existingToken.sessionId);

    const now = new Date();
    if (!session || now > session.endTime)
      return res.status(403).json({ message: "Voting session ended" });

    const candidate = await Candidate.findById(candidateId);
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    // Increase vote count
    candidate.votes += 1;
    await candidate.save();

    // Store anonymous vote
    await Vote.create({
      token,
      candidateId,
    });

    // Mark token used
    existingToken.used = true;
    await existingToken.save();

    // Mark student voted
    await Student.findByIdAndUpdate(existingToken.studentId, {
      hasVoted: true,
    });

    res.json({ message: "Vote cast successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
