const express = require("express");
const router = express.Router();
const crypto = require("crypto");

//const Student = require("../models/Student");
const Election = require("../models/Election");
const Vote = require("../models/Vote");
const Token = require("../models/Token");

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


router.post("/verify-face", protectStudent, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    const student = req.student;

    // ==============================
    // VALIDATE INPUT
    // ==============================
    if (
      !faceDescriptor ||
      !Array.isArray(faceDescriptor) ||
      faceDescriptor.length !== 128
    ) {
      return res.status(400).json({
        message: "Invalid face descriptor",
      });
    }

    // ==============================
    // CHECK ACTIVE ELECTION
    // ==============================
    const election = await Election.findOne({
      status: "active",
    });

    if (!election) {
      return res.status(404).json({
        message: "No active election",
      });
    }

    // ==============================
    // PREVENT DOUBLE VOTING
    // ==============================
    const alreadyVoted = await Vote.findOne({
      student: student._id,
      election: election._id,
    });

    if (alreadyVoted || student.hasVoted) {
      return res.status(403).json({
        message: "You have already voted",
      });
    }

    // ==============================
    // CHECK REGISTERED FACE
    // ==============================
    if (!student.faceDescriptor) {
      return res.status(400).json({
        message: "No registered facial data found",
      });
    }

    // ==============================
    // DECRYPT STORED FACE
    // ==============================
    const storedDescriptor = JSON.parse(
      decryptDescriptor(student.faceDescriptor)
    );

    // ==============================
    // COMPARE FACE DISTANCE
    // ==============================
    const distance = calculateDistance(
      storedDescriptor,
      faceDescriptor
    );

    const THRESHOLD = Number(process.env.FACE_THRESHOLD) || 0.45;

    console.log("FACE DISTANCE:", distance);

    // Lower distance = better match
    if (distance > THRESHOLD) {

      await logAudit("FACE_VERIFICATION_FAILED", {
        userId: student._id,
        userModel: "Student",
        ipAddress: req.ip,
        status: "FAILURE",
        details: {
          distance,
        },
      });

      return res.status(401).json({
        verified: false,
        message: "Face verification failed",
      });
    }

    // ==============================
    // REMOVE OLD TOKENS
    // ==============================
    await Token.deleteMany({
      student: student._id,
      election: election._id,
    });

    // ==============================
    // CREATE SECURE VOTING TOKEN
    // ==============================
    const votingToken = crypto
      .randomBytes(32)
      .toString("hex");

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await Token.create({
      token: votingToken,
      student: student._id,
      election: election._id,
      used: false,
      expiresAt,
    });

    // Optional:
    student.votingToken = votingToken;
    await student.save();

    // ==============================
    // AUDIT SUCCESS
    // ==============================
    await logAudit("FACE_VERIFICATION_SUCCESS", {
      userId: student._id,
      userModel: "Student",
      ipAddress: req.ip,
      status: "SUCCESS",
      details: {
        electionId: election._id,
      },
    });

    // ==============================
    // RESPONSE
    // ==============================
    return res.status(200).json({
      verified: true,
      token: votingToken,
      expiresAt,
    });

  } catch (err) {
    console.error("FACE VERIFY ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
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
// 🗳️ CHECK VOTING STATUS
// ==============================
router.get("/voting-status", protectStudent, async (req, res) => {
  try {
    const student = req.student;

    // 🔍 Get active election
    const election = await Election.findOne({ status: "active" });

    if (!election) {
      return res.status(404).json({ message: "No active election" });
    }

    // 🔍 Check if student has voted
    const vote = await Vote.findOne({
      student: student._id,
      election: election._id,
    }).populate({
  path: "candidateId",
  select: "name party position"
});

    if (vote) {
      return res.json({
        hasVoted: true,
        message: "Student has already voted",
        voteId: vote._id,
        candidate: {
          id: vote.candidateId._id,
          name: vote.candidateId.name,
          party: vote.candidateId.party,
          position: vote.candidateId.position,
        },
        
      });
      console.log(vote);
    }
    

    return res.json({
      hasVoted: false,
      message: "Student has not voted yet",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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