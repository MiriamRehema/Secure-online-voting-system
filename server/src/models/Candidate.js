const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  party: {
    type: String,
    required: true,
  },
  voteCount: {
    type: Number,
    default: 0, // start with 0 votes
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive:{
    type:Boolean,
    default:true
  },
   election: {   
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: true
  },
});


module.exports = mongoose.model("Candidate", candidateSchema);