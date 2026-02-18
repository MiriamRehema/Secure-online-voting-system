// tests/token.test.js
process.env.ENCRYPTION_KEY = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";;

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");

const Student = require("../src/models/Student");
const Token = require("../src/models/Token");
const VotingSession = require("../src/models/VotingSession");
const bcrypt = require("bcryptjs");
const { encryptDescriptor } = require("../src/utils/crypto");

describe("TOKEN LOGIC", () => {
  let studentId;
  let activeSession;

  beforeEach(async () => {
    await Token.deleteMany({});
    await Student.deleteMany({});
    await VotingSession.deleteMany({});

    const hashed = await bcrypt.hash("password123", 10);
    const faceDescriptor = [0.1, 0.2, 0.3, 0.4];
    const encryptedFace = encryptDescriptor(JSON.stringify(faceDescriptor));

    const student = await Student.create({
      regNumber: "REG123",
      fullName: "John Max",
      email: "student@test.com",
      course: "CS",
      year: "3",
      faceDescriptor: encryptedFace,
      hasVoted: false,
      password: hashed,
    });

    studentId = student._id;

    activeSession = await VotingSession.create({
      title: "Test Session",
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(Date.now() + 3600000),
      isActive: true,
    });
  });

  afterEach(async () => {
    await Token.deleteMany({});
    await Student.deleteMany({});
    await VotingSession.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("✅ Generate token for student after face verification", async () => {
    const res = await request(app)
      .post("/api/students/verify-face")
      .send({
        studentId,
        faceDescriptor: [0.1, 0.2, 0.3, 0.4],
      });

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body).toHaveProperty("token");

    const tokenDoc = await Token.findOne({ token: res.body.token });
    expect(tokenDoc.studentId.toString()).toBe(studentId.toString());
    expect(tokenDoc.sessionId.toString()).toBe(activeSession._id.toString());
    expect(tokenDoc.used).toBe(false);
  });
});
