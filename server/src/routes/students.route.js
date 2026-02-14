const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Student = require("../models/Student");
const { encryptDescriptor, decryptDescriptor } = require("../utils/crypto");

// ==============================
// 1️⃣ ADMIN REGISTERS STUDENT
// ==============================
router.post("/register", async (req, res) => {
  const { regNumber, fullName, email, course, year, faceDescriptor } = req.body;

  if (!regNumber || !fullName || !email || !course || !year || !faceDescriptor) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const existing = await Student.findOne({ regNumber });
    if (existing) return res.status(400).json({ message: "Student already exists" });

    const encryptedFace = encryptDescriptor(faceDescriptor);

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

// ==============================
// 2️⃣ STUDENT LOGIN
// ==============================
router.post("/login", async (req, res) => {
  const { regNumber, email } = req.body;

  if (!regNumber || !email) return res.status(400).json({ message: "Reg number and email required" });

  try {
    const student = await Student.findOne({ regNumber, email });
    if (!student) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      studentId: student._id,
      hasVoted: student.hasVoted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ==============================
// 3️⃣ FACE VERIFICATION
// ==============================
router.post("/verify-face", async (req, res) => {
  const { studentId, faceDescriptor } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const decryptedDescriptor = decryptDescriptor(student.faceDescriptor);

    const distance = calculateDistance(decryptedDescriptor, faceDescriptor);

    if (distance < 0.6) {
      return res.json({ verified: true });
    } else {
      return res.status(401).json({ verified: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ==============================
// FACE DISTANCE FUNCTION
// ==============================
function calculateDistance(desc1, desc2) {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

module.exports = router;
