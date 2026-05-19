const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require('resend');
const logAudit = require("../utils/logAudit");
const AuditLog = require("../models/AuditLog");
const Vote = require("../models/Vote");
const Admin = require("../models/Admin");

const protectAdmin = require("../middlewares/authMiddleware");

const Election = require("../models/Election");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");

const { encryptDescriptor, decryptDescriptor } = require("../utils/crypto");

// ==============================
// 📧 RESEND SETUP (created once, reused for all emails)
// ==============================
const resend = new Resend(process.env.RESEND_API_KEY);

// ==============================
// 👨‍💼 CREATE ADMIN ACCOUNT (mainAdmin only)
// ==============================
router.post("/create-admin", protectAdmin, async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
    return res.status(403).json({ message: "Only main admin can create admin accounts" });
  }

  try {
    const { regNumber, email, password, role } = req.body;

    if (!regNumber || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await Admin.findOne({ regNumber });
    if (existing) {
      return res.status(400).json({ message: "Admin with this reg number already exists" });
    }

    const admin = new Admin({ regNumber, email, password, role });
    await admin.save();

    logAudit("ADMIN_CREATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { newAdminId: admin._id, role },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.status(201).json({ message: "Admin account created successfully" });

    // 📧 Send welcome email (non-blocking)
    resend.emails.send({
      from: 'JKUAT Voting <onboarding@resend.dev>',
      to: email,
      subject: 'JKUAT Voting System - Admin Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">JKUAT Secure Voting System</h2>
          <h3>Admin Account Created</h3>
          <p>An admin account has been created for you.</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Admin ID:</strong> ${regNumber}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
            <p><strong>Role:</strong> ${role}</p>
          </div>
          <p>Please login and keep your credentials secure.</p>
          <a href="https://jkuat-online-voting-sysstem.netlify.app/admin-login"
             style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
            Login Now
          </a>
          <hr/>
          <p style="color: #888; font-size: 12px;">JKUAT Secure Voting System - JKUSA Elections</p>
        </div>
      `,
    })
    .then(() => console.log(`Welcome email sent to ${email}`))
    .catch((err) => console.error('Welcome email failed:', err));

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// 👨‍🎓 CREATE STUDENT
// ==============================
router.post("/students", protectAdmin, async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
    return res.status(403).json({
      message: "Only main admin can register students",
    });
  }

  try {
    let {
      regNumber,
      fullName,
      email,
      course,
      year,
      password,
      faceDescriptor,
    } = req.body;

    regNumber = regNumber.trim().toLowerCase();

    if (!regNumber || !fullName || !email || !course || !year || !password || !faceDescriptor) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await Student.findOne({ regNumber });
    if (existing) {
      return res.status(400).json({ message: "Student already exists" });
    }

    // ==============================
    // ✅ DUPLICATE FACE CHECK (server-side)
    // ==============================
    const allStudents = await Student.find().select("fullName regNumber faceDescriptor");
    const THRESHOLD = Number(process.env.FACE_THRESHOLD) || 0.45;

    for (const s of allStudents) {
      if (!s.faceDescriptor) continue;
      try {
        const storedDescriptor = JSON.parse(decryptDescriptor(s.faceDescriptor));
        const distance = Math.sqrt(
          faceDescriptor.reduce((sum, val, i) => sum + (val - storedDescriptor[i]) ** 2, 0)
        );
        if (distance < THRESHOLD) {
          return res.status(400).json({
            message: `This face is already registered to ${s.fullName} (${s.regNumber}). Each student must use their own face.`,
          });
        }
      } catch (e) {
        console.error("Face comparison error for student:", s._id, e);
        continue;
      }
    }

    const encryptedFace = encryptDescriptor(JSON.stringify(faceDescriptor));

    const student = new Student({
      regNumber,
      fullName,
      email,
      course,
      year,
      password: password,
      faceDescriptor: encryptedFace,
    });

    await student.save();

    await logAudit("STUDENT_REGISTER", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { studentId: student._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    // ==============================
    // ✅ RESPOND IMMEDIATELY — email sends in background
    // ==============================
    res.status(201).json({ message: "Student registered successfully" });

    // ==============================
    // 📧 WELCOME EMAIL (non-blocking — fires after response)
    // ==============================
    resend.emails.send({
      from: 'JKUAT Voting <onboarding@resend.dev>',
      to: student.email,
      subject: 'JKUAT Voting System - Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">JKUAT Secure Voting System</h2>
          <h3>Welcome, ${student.fullName}!</h3>
          <p>Your student voting account has been created successfully.</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Registration Number:</strong> ${student.regNumber}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
          </div>
          <p>Please login and change your password immediately after your first login.</p>
          <a href="https://jkuat-online-voting-sysstem.netlify.app/student-login"
             style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
            Login Now
          </a>
          <hr/>
          <p style="color: #888; font-size: 12px;">JKUAT Secure Voting System - JKUSA Elections</p>
        </div>
      `,
    })
    .then(() => console.log(`Welcome email sent to ${student.email}`))
    .catch((err) => console.error('Welcome email failed:', err));

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ==============================
// 📋 GET ALL STUDENTS
// ==============================
router.get("/students", protectAdmin, async (req, res) => {
  try {
    const students = await Student.find()
      .select("-password -faceDescriptor")
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

// ==============================
// 👤 GET ONE STUDENT
// ==============================
router.get("/students/:id", protectAdmin, async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
    return res.status(403).json({ message: "Not allowed" });
  }
  try {
    const student = await Student.findById(req.params.id).select(
      "-password -faceDescriptor"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Error fetching student" });
  }
});

// ==============================
// ✏️ UPDATE STUDENT
// ==============================
router.put("/students/:id", protectAdmin, async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
    return res.status(403).json({ message: "Not allowed" });
  }
  try {
    const { fullName, email, course, year } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (fullName) student.fullName = fullName;
    if (email) student.email = email;
    if (course) student.course = course;
    if (year) student.year = year;

    await student.save();

    logAudit("STUDENT_UPDATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { studentId: student._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Student updated successfully", student });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Error updating student" });
  }
});

// ==============================
// 🗑️ DELETE STUDENT
// ==============================
router.delete("/students/:id", protectAdmin, async (req, res) => {
  if (req.admin.role !== "mainAdmin") {
    return res.status(403).json({ message: "Not allowed" });
  }
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    logAudit("STUDENT_DELETE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { studentId: student._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting student" });
  }
});

// ==============================
// 🗳️ CREATE ELECTION
// ==============================
router.post("/elections", protectAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "mainAdmin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, description, startDate, endDate, allowedVoterGroups } = req.body;

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "Invalid dates" });
    }

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      allowedVoterGroups,
      status: "draft",
      createdBy: req.admin._id,
    });

    logAudit("ELECTION_CREATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { electionId: election._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.status(201).json(election);
  } catch (err) {
    res.status(500).json({ message: "Error creating election" });
  }
});

// ==============================
// 📝 GET ALL ELECTIONS
// ==============================
router.get("/elections", async (req, res) => {
  try {
    const elections = await Election.find()
      .populate("candidates")
      .sort({ createdAt: -1 });

    res.json(elections);
  } catch (err) {
    res.status(500).json({ message: "Error fetching elections" });
  }
});

// ==============================
// 🔄 UPDATE ELECTION STATUS
// ==============================
router.put("/elections/:id/status", protectAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    election.status = status;
    await election.save();

    logAudit("ELECTION_STATUS_UPDATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { electionId: election._id, status },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    // ✅ RESPOND IMMEDIATELY — emails send in background
    res.json(election);

    // ==============================
    // 📧 NOTIFY ALL STUDENTS WHEN ELECTION STARTS (non-blocking)
    // ==============================
    if (status === "active") {
      Student.find()
        .select("email fullName")
        .then((allStudents) => {
          const emailPromises = allStudents
            .filter((s) => s.email)
            .map((student) =>
              resend.emails.send({
                from: 'JKUAT Voting <onboarding@resend.dev>',
                to: student.email,
                subject: 'JKUAT Voting System - Voting is Now Open!',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2e7d32;">JKUAT Secure Voting System</h2>
                    <h3>Voting is Now Open!</h3>
                    <p>Hello ${student.fullName},</p>
                    <p>The JKUSA election <strong>${election.title}</strong> is now open for voting.</p>
                    <p>Login now to cast your vote. Every vote counts!</p>
                    <a href="https://jkuat-online-voting-sysstem.netlify.app/student-login"
                       style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
                      Vote Now
                    </a>
                    <hr/>
                    <p style="color: #888; font-size: 12px;">JKUAT Secure Voting System - JKUSA Elections</p>
                  </div>
                `,
              })
              .catch((err) => console.error(`Email failed for ${student.email}:`, err))
            );

          Promise.all(emailPromises).then(() =>
            console.log(`Election start emails sent to ${allStudents.length} students`)
          );
        })
        .catch((err) => console.error("Failed to fetch students for email:", err));
    }

  } catch (err) {
    res.status(500).json({ message: "Error updating election", error: err.message });
  }
});

// ==============================
// 👤 ADD CANDIDATE
// ==============================
router.post("/elections/:id/candidates", protectAdmin, async (req, res) => {
  try {
    const { name, position, party } = req.body;

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    if (!name || !position) {
      return res.status(400).json({ message: "Name and position required" });
    }

    const candidate = await Candidate.create({
      name,
      position,
      party,
      election: election._id,
    });

    election.candidates.push(candidate._id);
    await election.save();

    logAudit("CANDIDATE_CREATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { candidateId: candidate._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: "Error adding candidate" });
  }
});

// ==============================
// 🏆 GET ELECTION RESULTS
// ==============================
router.get("/elections/:id/results", async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    const candidates = await Candidate.find({
      election: election._id,
    }).select("name party position voteCount");

    candidates.sort((a, b) => b.voteCount - a.voteCount);

    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
    const totalStudents = await Student.countDocuments();
    const totalCompletedVoters = await Student.countDocuments({ hasVoted: true });

    return res.json({
      election: {
        id: election._id,
        title: election.title,
        status: election.status,
      },
      totalVotes,
      totalStudents,
      totalCompletedVoters,
      results: candidates,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// 📊 DASHBOARD STATS
// ==============================
router.get("/dashboard", protectAdmin, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalVotes = await Student.countDocuments({ hasVoted: true });
    const totalElections = await Election.countDocuments();
    const activeElections = await Election.countDocuments({ status: "active" });

    res.json({
      totalStudents,
      totalVotes,
      totalElections,
      activeElections,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// ==============================
// 📜 AUDIT LOGS
// ==============================
router.get("/audit-logs", protectAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);

    res.json(logs);
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
    res.status(500).json({ message: "Error fetching logs", error: err.message });
  }
});

// ==============================
// 👤 ADMIN PROFILE
// ==============================
router.get("/profile", protectAdmin, async (req, res) => {
  try {
    const admin = req.admin;
    res.json({
      _id: admin._id,
      role: admin.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching admin profile" });
  }
});

// ==============================
// 🗑️ RESET ALL ELECTION DATA
// ==============================
router.delete("/reset", protectAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "mainAdmin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const Election = require("../models/Election");
    const Candidate = require("../models/Candidate");
    const Vote = require("../models/Vote");
    const Token = require("../models/Token");

    await Election.deleteMany({});
    await Candidate.deleteMany({});
    await Vote.deleteMany({});
    await Token.deleteMany({});
    await Student.updateMany({}, { hasVoted: false, votingToken: null });

    logAudit("DATA_RESET", {
      userId: req.admin._id,
      userModel: "Admin",
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "All data reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resetting data" });
  }
});

// ==============================
// ✏️ UPDATE CANDIDATE
// ==============================
router.put("/elections/:electionId/candidates/:candidateId", protectAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "mainAdmin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { name, position, party } = req.body;

    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (name) candidate.name = name;
    if (position) candidate.position = position;
    if (party !== undefined) candidate.party = party;

    await candidate.save();

    logAudit("CANDIDATE_UPDATE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { candidateId: candidate._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Candidate updated successfully", candidate });
  } catch (err) {
    res.status(500).json({ message: "Error updating candidate" });
  }
});

// ==============================
// 🗑️ DELETE CANDIDATE
// ==============================
router.delete("/elections/:electionId/candidates/:candidateId", protectAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "mainAdmin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const candidate = await Candidate.findByIdAndDelete(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    await Election.findByIdAndUpdate(req.params.electionId, {
      $pull: { candidates: candidate._id },
    });

    logAudit("CANDIDATE_DELETE", {
      userId: req.admin._id,
      userModel: "Admin",
      details: { candidateId: candidate._id },
      ipAddress: req.ip,
      status: "SUCCESS",
    });

    res.json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting candidate" });
  }
});

module.exports = router;
