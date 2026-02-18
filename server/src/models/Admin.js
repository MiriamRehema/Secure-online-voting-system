const mongoose = require("mongoose");

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

module.exports = mongoose.model("Admin", adminSchema);
