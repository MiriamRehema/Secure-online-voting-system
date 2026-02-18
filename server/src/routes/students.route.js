const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const Student = require("../models/Student");
const { encryptDescriptor, decryptDescriptor } = require("../utils/crypto");

const Token = require("../models/Token");
const VotingSession = require("../models/VotingSession");



// ==============================


// ==============================
// 2️⃣ STUDENT LOGIN
// ==============================
router.post("/login", async (req, res) => {
  const { regNumber, password } = req.body;

  if (!regNumber || !password) return res.status(400).json({ message: "Reg number and password required" });

  try {
    const student = await Student.findOne({ regNumber: regNumber });
     if (!student) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

     res.status(200).json({
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

  // ✅ ADD THIS VALIDATION HERE
  if (!studentId || !faceDescriptor) {
    return res.status(400).json({ message: "Missing data" });
  }
   const activeSession = await VotingSession.findOne({ isActive: true });
   if (!activeSession) {
      return res.status(404).json({ message: "No active voting session" });
     }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

        const decryptedDescriptor = JSON.parse(
          decryptDescriptor(student.faceDescriptor)
        );

        const distance = calculateDistance(decryptedDescriptor, faceDescriptor);

       // inside /verify-face route after successful verification
      if (distance < 0.6) {
  // generate token
      let existingToken = await Token.findOne({ studentId: student._id, sessionId: activeSession._id });
       if (!existingToken) {
        const tokenString = crypto.randomBytes(32).toString("hex");
          const token = await Token.create({
          token: tokenString,
          studentId: student._id,
          sessionId: activeSession._id,
        });
          return res.status(200).json({ verified: true, token: tokenString });
        } else {
          return res.status(200).json({ verified: true, token: existingToken.token });
         }
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
