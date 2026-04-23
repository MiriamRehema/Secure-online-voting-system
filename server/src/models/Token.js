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
  { token: 1},
  { unique: true },
  { expiresAt: 1 }, { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("Token", tokenSchema);
