const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

// 1️⃣ Register Student (with face descriptor)
router.post("/register", async (req, res) => {
  const { regNumber, fullName, email, course, year, faceDescriptor } = req.body;

  if (!regNumber || !fullName || !email || !course || !year || !faceDescriptor) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingStudent = await Student.findOne({ regNumber });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already registered" });
    }

    const newStudent = new Student({
      regNumber,
      fullName,
      email,
      course,
      year,
      faceDescriptor,
    });

    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 2️⃣ Login Student (before face verification)
router.post("/login", async (req, res) => {
  const { regNumber, email } = req.body;

  if (!regNumber || !email) {
    return res.status(400).json({ message: "Reg number and email are required" });
  }

  try {
    const student = await Student.findOne({ regNumber, email });
    if (!student) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Student found, proceed to face verification",
      studentId: student._id, // frontend will use this for face check
      hasVoted: student.hasVoted,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
