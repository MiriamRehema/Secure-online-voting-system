const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const protectAdmin = require("../middlewares/authMiddleware");
router.post("/create-session", protectAdmin, async (req, res) => {
  
});
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
router.post("/register-student", async (req, res) => {
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
router.post("/create-session", async (req, res) => {
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
router.post("/add-candidate", async (req, res) => {
  const { name, position } = req.body;

  const candidate = new Candidate({ name, position });
  await candidate.save();

  res.json({ message: "Candidate added successfully" });
});

module.exports = router;









