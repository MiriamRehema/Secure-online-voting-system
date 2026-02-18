process.env.ENCRYPTION_KEY="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";


const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Student = require("../src/models/Student");
const bcrypt = require("bcryptjs");
const { encryptDescriptor } = require("../src/utils/crypto");

describe("STUDENT ROUTES", () => {
 
  beforeEach(async () => {
    const hashed = await bcrypt.hash("password123", 10);
    await Student.deleteMany({});
     const faceDescriptor = [0.1, 0.2, 0.3, 0.4];
    const encryptedFace = encryptDescriptor(
  JSON.stringify(faceDescriptor)
);
    await Student.create({
      regNumber: "REG123",
      fullName: "John Max",
      email: "student@test.com",
      course: "Computer Science",
      year: "3",
      faceDescriptor: encryptedFace, 
      hasVoted: false,
      password:hashed,
    });
  });

  afterEach(async () => {
    await Student.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==============================
  // LOGIN TESTS
  // ==============================

  test("1️⃣ Valid student login", async () => {
    const res = await request(app)
      .post("/api/students/login")
      .send({
        regNumber: "REG123",
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("studentId");
    expect(res.body.hasVoted).toBe(false);
  });

  test("2️⃣ Invalid registration number", async () => {
    const res = await request(app)
      .post("/api/students/login")
      .send({
        regNumber: "WRONG123",
        password: "password123",
      });

    expect(res.status).toBe(401);
  });

  test("3️⃣ Invalid password", async () => {
    const res = await request(app)
      .post("/api/students/login")
      .send({
        regNumber: "REG123",
        password: "wrong123",
      });

    expect(res.status).toBe(401);
  });

  test("4️⃣ Missing fields validation", async () => {
    const res = await request(app)
      .post("/api/students/login")
      .send({});

    expect(res.status).toBe(400);
  });

});
