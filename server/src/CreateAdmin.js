const mongoose = require("mongoose");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/secureOnlineVotingSystem");

async function createAdmin() {
  // Check if main admin already exists
  const existing = await Admin.findOne({ regNumber: "admin001" });
  if (existing) {
    console.log("⚠️  Main admin already exists, skipping creation.");
    mongoose.disconnect();
    return;
  }

  const admin = new Admin({
    regNumber: "admin001",
    password: "ADMIN123",       // will be hashed automatically
    role: "mainAdmin",
    email: "your-admin-email@gmail.com",  // ⚠️ CHANGE THIS to the real admin email
  });

  await admin.save();
  console.log("✅ Main admin created successfully!");
  mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error("❌ Error creating admin:", err);
  mongoose.disconnect();
});
