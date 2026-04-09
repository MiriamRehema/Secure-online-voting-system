const express = require("express");
const router = express.Router();

const Token = require("../models/Token");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const Election = require("../models/Election");
const Student = require("../models/Student");
const logAudit = require("../utils/auditLogger");
//
// CAST VOTE
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
    if (tokenDoc.expiresAt < new Date()) 
      return res.status(403).json({ message: "Token expired" });
    
    //get student
    const student = await Student.findById(tokenDoc.student);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
  
    //  Check election
    const election = await Election.findById(tokenDoc.election);
    if (!election.allowedCourses.includes(student.course))
    if (!election || election.status !== "active") {
      return res.status(400).json({ message: "Election not active" });
    }
    //  Candidate validation
    const candidate = await Candidate.findById(candidateId);
    if (!candidate || !candidate.election.equals(election._id)) {
      return res.status(400).json({ message: "Invalid candidate" });
    }
    //  Prevent double voting (extra safety)
    const alreadyVoted = await Vote.findOne({
      student: student._id,
      election: election._id,
    });

    if (alreadyVoted) {
      return res.status(400).json({ message: "Already voted" });
    }
    if (new Date() < election.startDate || new Date() > election.endDate)
    // ✅ Record vote
    await Vote.create({
      student: student._id,
      candidate: candidate._id,
      election: election._id,
      token: tokenDoc.token,
    });

    // 📊 Increment vote count
    candidate.voteCount += 1;
    await candidate.save();

    // 🔒 Mark token used
    tokenDoc.used = true;
    await tokenDoc.save();

    //  Audit log
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
