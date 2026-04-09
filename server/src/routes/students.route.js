const express = require("express");
const router = express.Router();
const crypto = require("crypto");
//const bcrypt = require("bcryptjs");

const Student = require("../models/Student");
const { encryptDescriptor, decryptDescriptor } = require("../utils/crypto");

const Token = require("../models/Token");




const Election = require("../models/Election");
const Vote = require("../models/Vote");

router.post("/verify-face", async (req, res) => {
  try {
    const { studentId, faceDescriptor } = req.body;

    if (!studentId || !faceDescriptor) {
      return res.status(400).json({ message: "Missing data" });
    }

    // 🔍 Get active election
    const election = await Election.findOne({ status: "active" });
    if (!election) {
      return res.status(404).json({ message: "No active election" });
    }

    //  Get student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    //  Already voted
    const alreadyVoted = await Vote.findOne({
      student: student._id,
      election: election._id,
    });

    if (alreadyVoted) {
      return res.status(400).json({ message: "Already voted" });
    }

    //  Decrypt stored face
    const decryptedDescriptor = JSON.parse(
      decryptDescriptor(student.faceDescriptor)
    );

    //  Compare faces
    if (!Array.isArray(faceDescriptor)) {
  return res.status(400).json({ message: "Invalid face data" });
}
    const distance = calculateDistance(decryptedDescriptor, faceDescriptor);

    const THRESHOLD = process.env.FACE_THRESHOLD || 0.6;
if (distance < THRESHOLD) {

      //  Generate or reuse token
      let existingToken = await Token.findOne({
        student: student._id,
        election: election._id,
        used: false,
      });

      if (!existingToken) {
        const tokenString = crypto.randomBytes(32).toString("hex");

        await Token.create({
          token: tokenString,
          student: student._id,
          election: election._id,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        });

        return res.json({ verified: true, token: tokenString });
      }

      return res.json({ verified: true, token: existingToken.token });

    } else {
      return res.status(401).json({ verified: false });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;