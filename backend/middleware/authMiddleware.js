const jwt = require("jsonwebtoken");

// ✅ Middleware: Verifies token and sets req.user
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      isAdmin: decoded.isAdmin,
      email: decoded.email,
    };
    next();
  } catch (err) {
    console.error("❌ JWT Verification Error:", err.message);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

// ✅ Middleware: Admin-only check
const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
};
