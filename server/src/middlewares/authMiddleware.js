const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Middleware to protect admin routes
const protectAdmin = async (req, res, next) => {
  let token;

  try {
    // Get token from headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach admin to request
      req.admin = await Admin.findById(decoded.id).select("-password");
      if (!req.admin) return res.status(401).json({ message: "Admin not found" });

      next();
    } else {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = protectAdmin;
