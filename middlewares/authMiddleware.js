// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]; 
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided 1" });
    }

    const token = authHeader.split(" ")[1]; // get token after "Bearer" 
   
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "default_secret"; // make sure to set in .env
    const decoded = jwt.verify(token, secret);

    // Attach user info to request
    req.user = decoded;

    next(); // move to next middleware/route
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
