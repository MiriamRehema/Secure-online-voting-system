// tests/admin.test.js


const request = require("supertest");
const app = require("../src/app");
const Admin = require("../src/models/Admin");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

describe("ADMIN AUTHENTICATION", () => {

  beforeEach(async () => {
    // Clear admin collection to avoid duplicates
    await Admin.deleteMany({});

    const hashed = await bcrypt.hash("password123", 10);

    await Admin.create({
      regNumber: "mainAdmin001",
      password: hashed,
      role: "mainAdmin", // match the enum in schema
    });
  });

  afterAll(async () => {
    // Close mongoose connection after all tests
    await mongoose.connection.close();
  });

  test("1️⃣5️⃣ Main admin login success", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ regNumber: "mainAdmin001", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe("mainAdmin");
  });

  test("1️⃣7️⃣ Admin login wrong password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ regNumber: "mainAdmin001", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid credentials/i);
  });

  test("1️⃣8️⃣ Admin login invalid regNumber", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ regNumber: "fakeAdmin021", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid credentials/i);
  });

});
