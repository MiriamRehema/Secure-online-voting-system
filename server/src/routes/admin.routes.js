


const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logAudit = require("../utils/logAudit");
const AuditLog = require("../models/AuditLog");
const Vote = require("../models/Vote");

const protectAdmin = require("../middlewares/authMiddleware");

const Election = require("../models/Election");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");

const { encryptDescriptor } = require("../utils/crypto");




// 1️⃣ ADMIN REGISTERS STUDENT
// ==============================


router.post("/students",protectAdmin , async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
    return res.status(403).json({ message: "Only main admin can register students" });
  }
  const { regNumber, fullName, email, course, year, password, faceDescriptor } = req.body;

  if (!regNumber || !fullName || !email || !course || !year || !password|| !faceDescriptor) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const existing = await Student.findOne({ regNumber });
    if (existing) return res.status(400).json({ message: "Student already exists" });

     // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);  // Salt rounds = 10

    const encryptedFace = encryptDescriptor(JSON.stringify(faceDescriptor));

    const student = new Student({
      regNumber,
      fullName,
      email,
      course,
      year,
      password :hashedPassword,
      faceDescriptor: encryptedFace,
    });
    
      const savedStudent = await student.save();  // Save the student to the database
      //console.log("Student saved successfully:", savedStudent);
    logAudit("STUDENT_REGISTER", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { studentId: student._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    
    res.status(201).json({ message: "Student registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});



// ==============================
// 🗳️ CREATE ELECTION
// ==============================
router.post("/elections", protectAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "mainAdmin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, description, startDate, endDate, allowedVoterGroups } = req.body;

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "Invalid dates" });
    }

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      allowedVoterGroups,
      status: "draft",
      createdBy: req.admin._id,
    });

    logAudit("ELECTION_CREATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { electionId: election._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.status(201).json(election);
  } catch (err) {
    res.status(500).json({ message: "Error creating election" });
  }
});


// ==============================
// 📝 GET ALL ELECTIONS
// ==============================
router.get("/elections", protectAdmin, async (req, res) => {
  try {
    const elections = await Election.find()
      .populate("candidates")
      .sort({ createdAt: -1 });

    res.json(elections);
  } catch (err) {
    res.status(500).json({ message: "Error fetching elections" });
  }
});


// ==============================
// 🔄 UPDATE ELECTION STATUS
// ==============================
router.put("/elections/:id/status", protectAdmin, async (req, res) => {
  try {
    const { status } = req.body;
     if (!status) {
  return res.status(400).json({ message: "Status is required" });
}

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
   

    election.status = status;
    await election.save();

    logAudit("ELECTION_STATUS_UPDATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { electionId: election._id, status },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json(election);
  } catch (err) {
    res.status(500).json({ message: "Error updating election" ,
      error: err.message
    });
  }
});


// ==============================
// 👤 ADD CANDIDATE
// ==============================
router.post("/elections/:id/candidates", protectAdmin, async (req, res) => {
  try {
    const { name, position, party } = req.body;

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    const candidate = await Candidate.create({
      name,
      position,
      party,
      election: election._id,
    });

    election.candidates.push(candidate._id);
    await election.save();

    logAudit("CANDIDATE_CREATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { candidateId: candidate._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: "Error adding candidate" });
  }
});


// ==============================
// 📊 DASHBOARD STATS
// ==============================
router.get("/dashboard", protectAdmin, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalVotes = await Vote.countDocuments();
    const totalElections = await Election.countDocuments();
    const activeElections = await Election.countDocuments({ status: "active" });

    res.json({
      totalStudents,
      totalVotes,
      totalElections,
      activeElections,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});


// ==============================
// 📜 AUDIT LOGS
// ==============================
router.get("/audit-logs", protectAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(logs);
  } catch (err) {
    console.erroe("AUDIT LOG ERROR:",err)
    res.status(500).json({ message: "Error fetching logs",
      error: err.message
     });
  }
});



module.exports = router;









