const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  course: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  faceDescriptor: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  hasVoted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
   votingToken: 
   { type: String, 
    default: null },
});

module.exports = mongoose.model("Student", studentSchema);
