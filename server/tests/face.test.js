process.env.ENCRYPTION_KEY = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const request = require("supertest");
const mongoose = require("mongoose"); // ✅ import mongoose

const app = require("../src/app");
const Student = require("../src/models/Student");
const VotingSession = require("../src/models/VotingSession");

const { encryptDescriptor } = require("../src/utils/crypto");

describe("FACE VERIFICATION", () => {

  let studentId;

  beforeEach(async () => {
    await VotingSession.deleteMany({});
    await Student.deleteMany({});

    await VotingSession.create({
      title: "Test Session",
      startTime: new Date(Date.now() - 1000 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
      isActive: true
    });

    const encryptedFace = encryptDescriptor(
      JSON.stringify([0.1, 0.2, 0.3, 0.4])
    );

    const student = await Student.create({
      regNumber: "REG123",
      password: "password123", // ✅ REQUIRED
      fullName: "John Max",
      email: "student@test.com",
      course: "Computer Science",
      year: "3",
      faceDescriptor: encryptedFace,
      hasVoted: false
    });

    studentId = student._id.toString();
  });

  test("5️⃣ Matching face descriptor", async () => {
    const res = await request(app)
      .post("/api/students/verify-face")
      .send({
        studentId,
        faceDescriptor: [0.1, 0.2, 0.3, 0.4]
      });

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
  });

  test("6️⃣ Non-matching face descriptor", async () => {
    const res = await request(app)
      .post("/api/students/verify-face")
      .send({
        studentId,
        faceDescriptor: [0.5, 0.6, 0.7, 0.9]
      });

    expect(res.status).toBe(401);
    expect(res.body.verified).toBe(false);
  });

  test("7️⃣ No face descriptor sent", async () => {
    const res = await request(app)
      .post("/api/students/verify-face")
      .send({ studentId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Missing data/i);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

});
