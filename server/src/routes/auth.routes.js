const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

const Student = require("../models/Student");
const Admin = require("../models/Admin");
const logAudit = require("../utils/logAudit");


// ==============================
// 👨‍🎓 STUDENT LOGIN (FIXED)
// ==============================
router.post("/student/login", async (req, res) => {
  try {
    let { regNumber, password } = req.body;

    if (!regNumber || !password) {
      return res.status(400).json({
        message: "Missing credentials",
      });
    }
   
    

    // ✅ NORMALIZATION (VERY IMPORTANT)
    regNumber = regNumber.trim().toLowerCase();
     console.log("LOGIN REGNUMBER:", regNumber);
    const student = await Student.findOne({ regNumber });
    console.log("STUDENT FOUND:", student);
    if (!student) {
      await logAudit("STUDENT_LOGIN_FAIL", {
        details: { regNumber },
        ipAddress: req.ip,
        status: "FAILURE",
      });

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 🔐 CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, student.password);
    console.log("INPUT PASSWORD:", password);
      console.log("DB HASH:", student.password);
     
     const test = await bcrypt.compare(password, student.password);
      console.log("BCRYPT DIRECT TEST:", test);

    if (!isMatch) {
      await logAudit("STUDENT_LOGIN_FAIL", {
        userId: student._id,
        userModel: "Student",
        ipAddress: req.ip,
        status: "FAILURE",
      });

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 🔑 GENERATE TOKEN
    const token = jwt.sign(
      {
        id: student._id,
        role: "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await logAudit("STUDENT_LOGIN_SUCCESS", {
      userId: student._id,
      userModel: "Student",
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    return res.json({
      token,
      studentId: student._id,
      fullName: student.fullName,
      regNumber: student.regNumber,
      isFirstLogin: student.isFirstLogin,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
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
      adminId: admin._id,
      redirect: "/admin/dashboard"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// 🔑 CHANGE PASSWORD
// ==============================
const protectStudent = require("../middlewares/protectStudent");

router.post("/student/change-password", protectStudent, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const student = req.student;
    student.password = newPassword;
    student.isFirstLogin = false;
    await student.save();
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// 🔑 FORGOT PASSWORD
// ==============================
router.post("/forgot-password", async (req, res) => {
  try {
    const { regNumber, email } = req.body;

    if (!regNumber || !email) {
      return res.status(400).json({ message: "Please provide reg number and email" });
    }

    const student = await Student.findOne({ 
      regNumber: regNumber.trim().toLowerCase(), 
      email: email.trim().toLowerCase() 
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found with those details" });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    student.resetPasswordToken = resetToken;
    student.resetPasswordExpiry = Date.now() + 3600000;
    await student.save();

    const resetLink = `https://jkuat-online-voting-sysstem.netlify.app/reset-password/${resetToken}`;

    // ✅ nodemailer loaded here (not at top) so server starts even if module has issues
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: 'JKUAT Voting System - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">JKUAT Secure Voting System</h2>
          <h3>Password Reset Request</h3>
          <p>Hello ${student.fullName},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          <p>This link expires in <strong>1 hour</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr/>
          <p style="color: #888; font-size: 12px;">JKUAT Secure Voting System - JKUSA Elections</p>
        </div>
      `
    });

    await logAudit("FORGOT_PASSWORD_REQUEST", {
      userId: student._id,
      userModel: "Student",
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Reset link sent to your email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// 🔑 RESET PASSWORD
// ==============================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Please provide a new password" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const student = await Student.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!student) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    student.password = password;
    student.resetPasswordToken = null;
    student.resetPasswordExpiry = null;
    await student.save();

    await logAudit("PASSWORD_RESET_SUCCESS", {
      userId: student._id,
      userModel: "Student",
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Password reset successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
