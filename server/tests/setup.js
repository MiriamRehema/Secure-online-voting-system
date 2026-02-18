// tests/setup.js
jest.setTimeout(30000); 
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");

// Correctly resolve the db.js path
const connectDB = require(path.resolve(__dirname, "../src/config/db"));

let mongoServer;

// This runs **before any test**
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri); // connect Mongoose to in-memory MongoDB
});

// This runs **after all tests**
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Optional: clear DB before each test for isolation
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
