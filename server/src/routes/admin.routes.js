process.env.JWT_SECRET = "testsecretkey123456789012345678901234567890"; // must be long enough


const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const protectAdmin = require("../middlewares/authMiddleware");

  
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");
const VotingSession = require("../models/VotingSession");
const { encryptDescriptor } = require("../utils/crypto");


// ADMIN LOGIN
router.post("/login", async (req, res) => {
  const { regNumber, password } = req.body;

  const admin = await Admin.findOne({ regNumber });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );        

  res.json({ token, role: admin.role });
});


// 1️⃣ ADMIN REGISTERS STUDENT
// ==============================


router.post("/register",protectAdmin , async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
    return res.status(403).json({ message: "Only main admin can register students" });
  }
  const { regNumber, fullName, email, course, year, faceDescriptor } = req.body;

  if (!regNumber || !fullName || !email || !course || !year || !faceDescriptor) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const existing = await Student.findOne({ regNumber });
    if (existing) return res.status(400).json({ message: "Student already exists" });

    const encryptedFace = encryptDescriptor(JSON.stringify(faceDescriptor));

    const student = new Student({
      regNumber,
      fullName,
      email,
      course,
      year,
      faceDescriptor: encryptedFace,
    });

    await student.save();
    res.status(201).json({ message: "Student registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});


// CREATE VOTING SESSION
router.post("/create-session", protectAdmin, async (req, res) => {
  const { title, startTime, endTime } = req.body;

  const session = new VotingSession({
    title,
    startTime,
    endTime,
    isActive: true,
  });

  await session.save();

  res.json({ message: "Voting session created", session });
});


// ADD CANDIDATE
router.post("/add-candidate",protectAdmin, async (req, res) => {
  const { name, position, party } = req.body;

  const candidate = new Candidate({ name, position ,party });
  await candidate.save();

  res.json({ message: "Candidate added successfully" });
});

// 5️⃣ ADMIN DASHBOARD DATA (role-based)
router.get("/dashboard", protectAdmin, async (req, res) => {
  try {
    const adminRole = req.admin.role; // we attached admin in the middleware

    let students = [];
    let candidates = [];
    let sessions = [];

    if (adminRole === "mainAdmin") {
      // Main admin can see everything
      students = await Student.find().select("-faceDescriptor"); // hide sensitive face data
      candidates = await Candidate.find();
      sessions = await VotingSession.find({ isActive: true });
    } else if (adminRole === "electionOfficer") {
      // Election officer only sees candidates & their results
      candidates = await Candidate.find();
      // optionally you could include vote counts here
      sessions = await VotingSession.find({ isActive: true });
      // students array stays empty
    } else {
      return res.status(403).json({ message: "Access forbidden for this role" });
    }

    res.json({
      students,
      candidates,
      sessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;









