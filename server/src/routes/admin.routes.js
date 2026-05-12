


const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logAudit = require("../utils/logAudit");
const AuditLog = require("../models/AuditLog");
const Vote = require("../models/Vote");

const protectAdmin = require("../middlewares/authMiddleware");
// console.log('protectAdmin loaded:', typeof protectAdmin);

const Election = require("../models/Election");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");

const { encryptDescriptor } = require("../utils/crypto");


//create student

router.post("/students", protectAdmin, async (req, res) => {

  if (req.admin.role !== "mainAdmin") {
    return res.status(403).json({
      message: "Only main admin can register students",
    });
  }

  try {
    let {
      regNumber,
      fullName,
      email,
      course,
      year,
      password,
      faceDescriptor,
    } = req.body;

    // =========================
    // 🧠 NORMALIZATION (IMPORTANT)
    // =========================
    regNumber = regNumber.trim().toLowerCase();

    if (
      !regNumber ||
      !fullName ||
      !email ||
      !course ||
      !year ||
      !password ||
      !faceDescriptor
    ) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    // =========================
    // CHECK EXISTING STUDENT
    // =========================
    const existing = await Student.findOne({ regNumber });

    if (existing) {
      return res.status(400).json({
        message: "Student already exists",
      });
    }

    

    // =========================
    // ENCRYPT FACE
    // =========================
    const encryptedFace = encryptDescriptor(
      JSON.stringify(faceDescriptor)
    );

    // =========================
    // CREATE STUDENT
    // =========================
    const student = new Student({
      regNumber, // ✅ normalized value
      fullName,
      email,
      course,
      year,
      password:password,
      faceDescriptor: encryptedFace,
    });

    await student.save();

    // =========================
    // AUDIT LOG
    // =========================
    await logAudit("STUDENT_REGISTER", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { studentId: student._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.status(201).json({
      message: "Student registered successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
    });
  }
});
//get all students
router.get("/students", protectAdmin, async (req, res) => {
  try {
    const students = await Student.find()
      .select("-password -faceDescriptor")
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

// ==============================
// 👤 GET ONE STUDENT
// ==============================
router.get("/students/:id", protectAdmin, async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
  return res.status(403).json({ message: "Not allowed" });
}
  try {
    const student = await Student.findById(req.params.id)
      .select("-password -faceDescriptor");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Error fetching student" });
  }
});
// ==============================
// ✏️ UPDATE STUDENT
// ==============================
router.put("/students/:id", protectAdmin, async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
  return res.status(403).json({ message: "Not allowed" });
}
  try {
    const { fullName, email, course, year } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update fields (only if provided)
    if (fullName) student.fullName = fullName;
    if (email) student.email = email;
    if (course) student.course = course;
    if (year) student.year = year;

    await student.save();

    logAudit("STUDENT_UPDATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { studentId: student._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Student updated successfully", student });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Error updating student" });
  }
});
// ==============================
// 🗑️ DELETE STUDENT
// ==============================
router.delete("/students/:id", protectAdmin, async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
  return res.status(403).json({ message: "Not allowed" });
}
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    

    logAudit("STUDENT_DELETE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { studentId: student._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting student" });
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
    if (!name || !position) {
     return res.status(400).json({ message: "Name and position required" });
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
// 🏆 GET ELECTION RESULTS
router.get("/elections/:id/results", protectAdmin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // 🔍 Get all candidates for this election
    const candidates = await Candidate.find({
      election: election._id,
    }).select("name party position voteCount");

    // 📊 Sort by votes (highest first)
    candidates.sort((a, b) => b.voteCount - a.voteCount);

    const totalVotes = candidates.reduce(
      (sum, c) => sum + c.voteCount,
      0
    );

    return res.json({
      election: {
        id: election._id,
        title: election.title,
        status: election.status,
      },
      totalVotes,
      results: candidates,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});// 🏆 GET ELECTION RESULTS
router.get("/elections/:id/results", protectAdmin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // 🔍 Get all candidates for this election
    const candidates = await Candidate.find({
      election: election._id,
    }).select("name party position voteCount");

    // 📊 Sort by votes (highest first)
    candidates.sort((a, b) => b.voteCount - a.voteCount);

    const totalVotes = candidates.reduce(
      (sum, c) => sum + c.voteCount,
      0
    );

    return res.json({
      election: {
        id: election._id,
        title: election.title,
        status: election.status,
      },
      totalVotes,
      results: candidates,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
    console.error("AUDIT LOG ERROR:",err)
    res.status(500).json({ message: "Error fetching logs",
      error: err.message
     });
  }
});
router.get("/profile", protectAdmin, async (req, res) => {
  try {
    const admin = req.admin;

    res.json({
      _id: admin._id,
     
      role: admin.role
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching admin profile" });
  }
});



module.exports = router;









