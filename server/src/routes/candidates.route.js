const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");

// @route   GET /api/candidates
// @desc    Get all candidates
// @access  Public (frontend can fetch)
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   POST /api/candidates
// @route   POST /api/candidates/bulk
router.post("/bulk", async (req, res) => {
  try {
    const candidates = await Candidate.insertMany(req.body);
    res.status(201).json(candidates);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
// @desc    Add a new candidate (admin only later)
// @access  Private
router.post("/", async (req, res) => {
  const { name, position, party } = req.body;

  if (!name || !position || !party) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  try {
    const newCandidate = new Candidate({ name, position, party });
    const savedCandidate = await newCandidate.save();
    res.status(201).json(savedCandidate);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

