const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const protectAdmin = require("../middlewares/authMiddleware");

  
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");
const VotingSession = require("../models/VotingSession");


// ADMIN LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
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


// REGISTER STUDENT (ENROLLMENT)
router.post("/register-student",protectAdmin , async (req, res) => {
  const { regNumber, fullName, email, course, year, faceDescriptor } = req.body;

  const existing = await Student.findOne({ regNumber });
  if (existing)
    return res.status(400).json({ message: "Student already exists" });

  const student = new Student({
    regNumber,
    fullName,
    email,
    course,
    year,
    faceDescriptor,
  });

  await student.save();

  res.json({ message: "Student registered successfully" });
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

// ==============================
// 5️⃣ ADMIN DASHBOARD DATA
// ==============================
router.get("/dashboard", protectAdmin, async (req, res) => {
  try {
    // Fetch students
    const students = await Student.find().select("-faceDescriptor"); // optional: hide sensitive data

    // Fetch candidates
    const candidates = await Candidate.find();

    // Fetch active voting sessions
    const sessions = await VotingSession.find({ isActive: true });

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









