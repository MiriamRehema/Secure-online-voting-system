// server/src/config/db.js
const mongoose = require("mongoose");

async function connectDB(uri) {
  if (!uri) throw new Error("MongoDB URI not provided!");
  await mongoose.connect(uri); // no options needed in Mongoose 7+
  console.log("MongoDB connected");
}

module.exports = connectDB;
