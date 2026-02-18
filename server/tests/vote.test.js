// tests/vote.test.js

const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../src/app");

const Student = require("../src/models/Student");
const Candidate = require("../src/models/Candidate");
const Token = require("../src/models/Token");
const Vote = require("../src/models/Vote");
const VotingSession = require("../src/models/VotingSession");
const bcrypt = require("bcryptjs");

describe("VOTE ROUTE", () => {
  let studentId;
  let candidateId;
  let tokenString;
  let session;

  beforeEach(async () => {
    await Student.deleteMany({});
    await Candidate.deleteMany({});
    await Token.deleteMany({});
    await Vote.deleteMany({});
    await VotingSession.deleteMany({});

    // Create student
    const student = await Student.create({
      regNumber: "REG123",
      fullName: "John Max",
      email: "student@test.com",
      course: "Computer Science",
      year: "3",
      faceDescriptor: "fakeEncryptedFace",
      hasVoted: false,
      password: await bcrypt.hash("password123", 10),
    });

    studentId = student._id;

    // Create candidate (MATCHES YOUR SCHEMA)
    const candidate = await Candidate.create({
      name: "Jane Doe",
      position: "President",
      party: "Unity Party",
    });

    candidateId = candidate._id;

    // Create voting session
    session = await VotingSession.create({
      title: "Test Election",
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(Date.now() + 3600000),
      isActive: true,
    });

    // Create valid token
    const token = await Token.create({
      token: "VALIDTOKEN123",
      studentId,
      sessionId: session._id,
      used: false,
    });

    tokenString = token.token;
  });

  afterEach(async () => {
    await Student.deleteMany({});
    await Candidate.deleteMany({});
    await Token.deleteMany({});
    await Vote.deleteMany({});
    await VotingSession.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==============================
  // TESTS
  // ==============================

  test("✅ Successful vote", async () => {
    const res = await request(app)
      .post("/api/votes")
      .send({
        token: tokenString,
        candidateId,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/success/i);

    // Vote should be recorded
    const vote = await Vote.findOne({ token: tokenString });
    expect(vote).toBeTruthy();

    // Candidate votes should increase
    const updatedCandidate = await Candidate.findById(candidateId);
    expect(updatedCandidate.votes).toBe(1);

    // Token should be marked as used
    const updatedToken = await Token.findOne({ token: tokenString });
    expect(updatedToken.used).toBe(true);
  });

  test("❌ Using token twice", async () => {
    // First vote
    await request(app)
      .post("/api/votes")
      .send({ token: tokenString, candidateId });

    // Second attempt
    const res = await request(app)
      .post("/api/votes")
      .send({ token: tokenString, candidateId });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/already used/i);
  });

  test("❌ Invalid token", async () => {
    const res = await request(app)
      .post("/api/votes")
      .send({
        token: "BADTOKEN",
        candidateId,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  test("❌ Candidate not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/votes")
      .send({
        token: tokenString,
        candidateId: fakeId,
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/candidate not found/i);
  });

  test("❌ Missing fields", async () => {
    const res = await request(app)
      .post("/api/votes")
      .send({});

    expect(res.status).toBe(400);
  });
});
