const mongoose = require("mongoose");
const Admin = require("./models/Admin");

mongoose.connect("mongodb://127.0.0.1:27017/secureOnlineVotingSystem");

async function createAdmin() {
  await Admin.deleteMany(); // 🔥 optional: clear old broken data

  const admin = new Admin({
    regNumber: "admin001",
    password: "ADMIN123", // 🔥 plain → will be hashed automatically
    role: "mainAdmin",
  });

  await admin.save();

  console.log("✅ Admin created successfully!");
  mongoose.disconnect();
}

createAdmin();