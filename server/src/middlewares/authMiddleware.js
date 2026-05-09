const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
  console.log("protectAdmin hit!");
//   if (req.method === "OPTIONS") {
//   return res.sendStatus(204);
// }
  
  
  // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  // res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    const authHeader = req.headers.authorization;
    console.log("AUTH HEADER:", authHeader);

    // 1. Check if header exists and is correct
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // 2. Extract token ONLY (remove "Bearer ")
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing after split" });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Fetch admin
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;

    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);

    return res.status(401).json({
      message: "Not authorized, token failed",
      error: err.message,
    });
  }
};

module.exports = protectAdmin;