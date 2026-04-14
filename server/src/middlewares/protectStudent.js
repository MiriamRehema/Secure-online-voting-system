const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

const protectStudent = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.student = await Student.findById(decoded.id).select("-password");

      next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
};

module.exports = protectStudent;