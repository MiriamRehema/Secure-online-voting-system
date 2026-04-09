const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  election: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Election",
},
  used: {
    type: Boolean,
    default: false,
  },
  
  expiresAt:Date
});
tokenSchema.index(
  { student: 1, election: 1 },
  { unique: true }
);

module.exports = mongoose.model("Token", tokenSchema);
