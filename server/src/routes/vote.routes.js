const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Token = require("../models/Token");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const Election = require("../models/Election");
const Student = require("../models/Student");
const protectStudent = require("../middlewares/protectStudent");
const logAudit = require("../utils/logAudit");

router.post("/", protectStudent, async (req, res) => {
  const { token, candidateId } = req.body;
  if (!token || !candidateId) {
    return res.status(400).json({ message: "Token and candidate required" });
  }
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenDoc = await Token.findOne({ tokenHash });
    if (!tokenDoc) {
      return res.status(403).json({ message: "Invalid token" });
    }
    if (!tokenDoc.student.equals(req.student._id)) {
      return res.status(403).json({ message: "Token does not belong to user" });
    }
    if (tokenDoc.used) {
      return res.status(403).json({ message: "Token already used" });
    }
    if (tokenDoc.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token expired" });
    }

    const student = req.student;
    const election = await Election.findById(tokenDoc.election);
    if (!election || election.status !== "active") {
      return res.status(400).json({ message: "Election not active" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(400).json({ message: "Invalid candidate" });
    }
    if (!candidate.election) {
      return res.status(400).json({ message: "Candidate not linked to election" });
    }
    if (candidate.election.toString() !== election._id.toString()) {
      return res.status(400).json({ message: "Candidate does not belong to this election" });
    }

    // 🚫 Check duplicate vote per POSITION
    const alreadyVotedPosition = await Vote.findOne({
      student: student._id,
      election: election._id,
      position: candidate.position,
    });
    if (alreadyVotedPosition) {
      return res.status(400).json({ message: `You have already voted for ${candidate.position}` });
    }

    // ✅ Save vote with position
    await Vote.create({
      student: student._id,
      candidateId: candidate._id,
      election: election._id,
      token: tokenHash,
      position: candidate.position,
    });

    // 🔢 Increment vote count
    await Candidate.findByIdAndUpdate(candidateId, {
      $inc: { voteCount: 1 },
    });

    // 📊 Get all positions in this election
    const allCandidates = await Candidate.find({ election: election._id });
    const allPositions = [...new Set(allCandidates.map(c => c.position))];

    // 📊 Check how many positions student has voted for
    const studentVotes = await Vote.find({
      student: student._id,
      election: election._id,
    });
    const votedPositions = studentVotes.map(v => v.position);
    const allPositionsVoted = allPositions.every(p => votedPositions.includes(p));

    // 🔒 Only mark token used and hasVoted when ALL positions are done
    if (allPositionsVoted) {
      tokenDoc.used = true;
      await tokenDoc.save();
      await Student.findByIdAndUpdate(student._id, { hasVoted: true });
    }

    logAudit("VOTE_CAST", {
      userId: student._id,
      userModel: "Student",
      details: { candidateId, electionId: election._id, position: candidate.position },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    return res.json({
      message: "Vote cast successfully",
      allPositionsVoted,
      votedPositions,
      remainingPositions: allPositions.filter(p => !votedPositions.includes(p))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
