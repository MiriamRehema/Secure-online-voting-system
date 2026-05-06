const express = require("express");
const router = express.Router();

const Token = require("../models/Token");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const Election = require("../models/Election");
const protectStudent = require("../middlewares/protectStudent");
const logAudit = require("../utils/logAudit");

// 🗳️ CAST VOTE
router.post("/", protectStudent, async (req, res) => {
  const { token, candidateId } = req.body;

  if (!token || !candidateId) {
    return res.status(400).json({ message: "Token and candidate required" });
  }

  try {
    // 🔍 Find token
    const tokenDoc = await Token.findOne({ token });

    if (!tokenDoc) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // 🔐 Check ownership
    if (!tokenDoc.student.equals(req.student._id)) {
      return res.status(403).json({ message: "Token does not belong to user" });
    }

    // ⛔ Check if used
    if (tokenDoc.used) {
      return res.status(403).json({ message: "Token already used" });
    }

    // ⏳ Check expiry
    if (tokenDoc.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token expired" });
    }

    console.log("Now:", new Date());
    console.log("ExpiresAt:", tokenDoc.expiresAt);

    const student = req.student;

    // 🗳️ Check election
    const election = await Election.findById(tokenDoc.election);

    if (!election || election.status !== "active") {
      return res.status(400).json({ message: "Election not active" });
    }

    // ⏱️ Check voting window
    // if (new Date() < election.startDate || new Date() > election.endDate) {
    //   return res.status(400).json({ message: "Voting period closed" });
    // }

    // 🎯 Validate candidate
    const candidate = await Candidate.findById(candidateId);

      if (!candidate) {
      return res.status(400).json({ message: "Invalid candidate" });
      }

//  ensure election exists on candidate
       if (!candidate.election) {
       return res.status(400).json({ message: "Candidate not linked to election" });
       }

// 🔒 compare safely
    if (candidate.election.toString() !== election._id.toString()) {
      return res.status(400).json({ message: "Candidate does not belong to this election" });
      }

    // 🚫 Prevent double voting
    const alreadyVoted = await Vote.findOne({
      student: student._id,
      election: election._id,
    });

    if (alreadyVoted) {
      return res.status(400).json({ message: "Already voted" });
    }

    // ✅ Save vote
    await Vote.create({
      student: student._id,
      candidateId: candidate._id,
      election: election._id,
      token: tokenDoc.token,
    });

    // 🔢 Increment vote count (safe way)
    await Candidate.findByIdAndUpdate(candidateId, {
      $inc: { voteCount: 1 },
    });

    // 🔒 Mark token used
    tokenDoc.used = true;
    await tokenDoc.save();

    // 📝 Audit log
    logAudit("VOTE_CAST", {
      userId: student._id,
      userModel: "Student",
      details: { candidateId, electionId: election._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    return res.json({ message: "Vote cast successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;