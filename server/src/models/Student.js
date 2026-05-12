const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const studentSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
    trim:true,
    lowercase:true,
    
  },
  password: {
    type: String,
    required: true,
    minlength:6,
  },
  fullName: {
    type: String,
    required: true,
    trim:true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase:true,
    trim:true,
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
studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
  
});
// 🔑 PASSWORD COMPARE METHOD
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model("Student", studentSchema);
