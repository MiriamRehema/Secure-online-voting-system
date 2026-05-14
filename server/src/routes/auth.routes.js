const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
     //console.log("MATCH RESULT:", await bcrypt.compare(password, student.password));
     
     
     const test = await bcrypt.compare(password, student.password);
      console.log("BCRYPT DIRECT TEST:", test);
     // console.log(bcrypt.compareSync("Password@123", "$2b$10$GDpuUGhJHBpkS/LwjlUpa.GTDDiwslF1Frv.u1jBMffH.P0W2CEMq")



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
    }
    
  );

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

module.exports = router;
