const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin"); // adjust path if needed

mongoose.connect("mongodb://127.0.0.1:27017/secureOnlineVotingSystem", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("ADMIN123", 10);

  const admin = new Admin({
    regNumber: "admin001",
    password: hashedPassword,
    role: "mainAdmin",
  });

  await admin.save();
  console.log("Admin created!");
  mongoose.disconnect();
}

createAdmin();