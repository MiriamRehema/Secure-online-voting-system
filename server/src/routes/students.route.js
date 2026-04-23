const express = require("express");
const router = express.Router();
const crypto = require("crypto");

//const Student = require("../models/Student");
const Election = require("../models/Election");
const Vote = require("../models/Vote");
const Token = require("../models/Token");
//const AuditLog = require("../models/AuditLog");
const { decryptDescriptor } = require("../utils/crypto");
const protectStudent = require("../middlewares/protectStudent");
const logAudit = require("../utils/logAudit");

// ==============================
// 🧠 FACE DISTANCE FUNCTION
// ==============================
function calculateDistance(desc1, desc2) {
  return Math.sqrt(
    desc1.reduce((sum, val, i) => sum + (val - desc2[i]) ** 2, 0)
  );
}

// ==============================
// 📸 VERIFY FACE (SECURE)
// ==============================
router.post("/verify-face", protectStudent, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    const student = req.student;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ message: "Valid face data required" });
    }

    // 🔍 Get active election
    const election = await Election.findOne({ status: "active" });
    if (!election) {
      return res.status(404).json({ message: "No active election" });
    }

    // Check voter eligibility
    // if (!election.allowedVoterGroups.includes(student.course)) {
    //   return res.status(403).json({ message: "Not allowed to vote" });
    // }

    // 🛑 Prevent double voting
    const alreadyVoted = await Vote.findOne({
      student: student._id,
      election: election._id,
    });

    if (alreadyVoted) {
      return res.status(400).json({ message: "Already voted" });
    }

    // 🔐 Decrypt stored face descriptor
    const decryptedDescriptor = JSON.parse(
      decryptDescriptor(student.faceDescriptor)
    );

    // 🧠 Compare faces
    const distance = calculateDistance(decryptedDescriptor, faceDescriptor);
    const THRESHOLD = process.env.FACE_THRESHOLD || 0.6;

    if (distance >= THRESHOLD) {
      logAudit("FACE_VERIFICATION_FAIL", {
        userId: student._id,
        userModel: "Student",
        ipAddress: req.ip,
        status: "FAILURE",
      });

      return res.status(401).json({ verified: false });
    }

    // 🔑 Check existing valid token
    let existingToken = await Token.findOne({
      student: student._id,
      election: election._id,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingToken && existingToken.expiresAt > new Date()) {
      return res.json({
        verified: true,
        token: existingToken.token,
      });
    }

    // 🆕 Create new voting token
    const tokenString = crypto.randomBytes(32).toString("hex");

    const newToken = await Token.create({
      token: tokenString,
      student: student._id,
      election: election._id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      
    });

    logAudit("FACE_VERIFICATION_SUCCESS", {
      userId: student._id,
      userModel: "Student",
      details: { electionId: election._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    return res.json({
      verified: true,
      token: newToken.token,
    });

  } catch (err) {
    console.error("FACE VERIFY ERROR:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// ==============================
// 🗳️ GET ACTIVE ELECTION (for frontend)
// ==============================
router.get("/active-election", protectStudent, async (req, res) => {
  try {
    const election = await Election.findOne({ status: "active" })
      .populate("candidates");

    if (!election) {
      return res.status(404).json({ message: "No active election" });
    }

    res.json(election);
  } catch (err) {
    res.status(500).json({ message: "Error fetching election" });
  }
});

// ==============================
// 👤 GET STUDENT PROFILE
// ==============================
router.get("/profile", protectStudent, async (req, res) => {
  try {
    const student = req.student;

    res.json({
      id: student._id,
      fullName: student.fullName,
      regNumber: student.regNumber,
      course: student.course,
      year: student.year,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

module.exports = router;