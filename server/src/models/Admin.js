const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const adminSchema = new mongoose.Schema({
  
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["mainAdmin", "electionOfficer"],
    required: true,
  },
  regNumber: {
    type: String,
    required: true,
    unique: true,
  },
});
// 🔐 AUTO HASH PASSWORD
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// 🔑 PASSWORD COMPARE METHOD
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
