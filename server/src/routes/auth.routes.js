const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const Admin = require("../models/Admin");
const logAudit = require("../utils/logAudit");


// ==============================
// 👨‍🎓 STUDENT LOGIN
// ==============================
router.post("/student/login", async (req, res) => {
  try {
    const { regNumber, password } = req.body;

    if (!regNumber || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const student = await Student.findOne({ regNumber });

    if (!student) {
      logAudit("STUDENT_LOGIN_FAIL", {
        details: { regNumber },
        ipAddress: req.ip,
        status: "FAILURE",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      logAudit("STUDENT_LOGIN_FAIL", {
        userId: student._id,
        userModel: "Student",
        ipAddress: req.ip,
        status: "FAILURE",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    logAudit("STUDENT_LOGIN_SUCCESS", {
      userId: student._id,
      userModel: "Student",
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({
      studentId: student._id,
      fullName: student.fullName,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ==============================
// 👨‍💼 ADMIN LOGIN
// ==============================
router.post("/admin/login", async (req, res) => {
  try {
    const { regNumber, password } = req.body;

    if (!regNumber || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const admin = await Admin.findOne({ regNumber });

    if (!admin) {
      logAudit("ADMIN_LOGIN_FAIL", {
        details: { regNumber },
        ipAddress: req.ip,
        status: "FAILURE",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ USE MODEL METHOD
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      logAudit("ADMIN_LOGIN_FAIL", {
        userId: admin._id,
        userModel: "Admin",
        ipAddress: req.ip,
        status: "FAILURE",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    logAudit("ADMIN_LOGIN_SUCCESS", {
      userId: admin._id,
      userModel: "Admin",
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({
      token,
      role: admin.role,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
