const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { Resend } = require('resend');

const Student = require("../models/Student");
const Admin = require("../models/Admin");
const logAudit = require("../utils/logAudit");

// ==============================
// 📧 RESEND SETUP
// ==============================
const resend = new Resend(process.env.RESEND_API_KEY);


// ==============================
// 👨‍🎓 STUDENT LOGIN
// ==============================
router.post("/student/login", async (req, res) => {
  try {
    let { regNumber, password } = req.body;

    if (!regNumber || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    regNumber = regNumber.trim().toLowerCase();

    const student = await Student.findOne({ regNumber });

    if (!student) {
      await logAudit("STUDENT_LOGIN_FAIL", {
        details: { regNumber },
        ipAddress: req.ip,
        status: "FAILURE",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      await logAudit("STUDENT_LOGIN_FAIL", {
        userId: student._id,
        userModel: "Student",
        ipAddress: req.ip,
        status: "FAILURE",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: student._id, role: "student" },
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
    res.status(500).json({ message: "Server error" });
  }
});


// ==============================
// 👨‍💼 ADMIN LOGIN — STEP 1 (password check → send OTP)
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

    // ✅ Password correct — generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    admin.otp = otp;
    admin.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes
    await admin.save();

    // ✅ Respond immediately
    res.json({ message: "OTP sent to your email", otpSent: true, adminId: admin._id });

    // 📧 Send OTP email (non-blocking)
    resend.emails.send({
      from: 'JKUAT Voting <onboarding@resend.dev>',
      to: admin.email,
      subject: 'JKUAT Voting System - Your Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">JKUAT Secure Voting System</h2>
          <h3>Admin Login - One Time Password</h3>
          <p>Your OTP for admin login is:</p>
          <div style="background: #f5f5f5; padding: 24px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2e7d32; letter-spacing: 8px; font-size: 48px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP expires in <strong>5 minutes</strong>.</p>
          <p>If you did not attempt to login, please contact the system administrator immediately.</p>
          <hr/>
          <p style="color: #888; font-size: 12px;">JKUAT Secure Voting System - JKUSA Elections</p>
        </div>
      `,
    })
    .then(() => console.log(`OTP email sent to ${admin.email}`))
    .catch((err) => console.error('OTP email failed:', err));

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ==============================
// 👨‍💼 ADMIN LOGIN — STEP 2 (verify OTP → issue token)
// ==============================
router.post("/admin/verify-otp", async (req, res) => {
  try {
    const { adminId, otp } = req.body;

    if (!adminId || !otp) {
      return res.status(400).json({ message: "Missing OTP or admin ID" });
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check OTP matches and hasn't expired
    if (admin.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    if (!admin.otpExpiry || admin.otpExpiry < new Date()) {
      return res.status(401).json({ message: "OTP has expired, please login again" });
    }

    // ✅ OTP valid — clear it and issue JWT
    admin.otp = null;
    admin.otpExpiry = null;
    await admin.save();

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
      redirect: "/admin/dashboard",
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
      email: email.trim().toLowerCase(),
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found with those details" });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    student.resetPasswordToken = resetToken;
    student.resetPasswordExpiry = Date.now() + 3600000;
    await student.save();

    const resetLink = `https://jkuat-online-voting-sysstem.netlify.app/reset-password/${resetToken}`;

    await logAudit("FORGOT_PASSWORD_REQUEST", {
      userId: student._id,
      userModel: "Student",
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Reset link sent to your email" });

    resend.emails.send({
      from: 'JKUAT Voting <onboarding@resend.dev>',
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
      `,
    })
    .then(() => console.log(`Reset email sent to ${student.email}`))
    .catch((err) => console.error('Reset email failed:', err));

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
      resetPasswordExpiry: { $gt: Date.now() },
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
