// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// ✅ Enhanced token verification middleware
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    console.log("🔐 Token verification:", {
      hasAuthHeader: !!authHeader,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    if (!authHeader) {
      console.log("❌ No authorization header provided");
      return res.status(401).json({ 
        message: "Access Denied. No authorization header provided." 
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.log("❌ Invalid authorization header format");
      return res.status(401).json({ 
        message: "Access Denied. Invalid authorization header format. Use 'Bearer <token>'" 
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      console.log("❌ No token in authorization header");
      return res.status(401).json({ 
        message: "Access Denied. No token provided." 
      });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured in environment variables");
      return res.status(500).json({ 
        message: "Server configuration error" 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("✅ Token verified successfully:", {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin
    });

    // Add user info to request object
    req.user = {
      id: decoded.userId,
      userId: decoded.userId, // For backward compatibility
      isAdmin: decoded.isAdmin,
      email: decoded.email,
    };

    next();
    
  } catch (err) {
    console.error("❌ JWT Verification Error:", {
      message: err.message,
      name: err.name,
      url: req.url
    });

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Invalid Token",
        error: "The provided token is malformed or invalid"
      });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Token Expired",
        error: "The provided token has expired. Please login again."
      });
    } else if (err.name === 'NotBeforeError') {
      return res.status(401).json({ 
        message: "Token Not Active",
        error: "The provided token is not active yet"
      });
    } else {
      return res.status(500).json({ 
        message: "Token verification failed",
        error: process.env.NODE_ENV === 'development' ? err.message : 'Authentication error'
      });
    }
  }
};

// ✅ Enhanced admin-only middleware
const verifyAdmin = (req, res, next) => {
  console.log("👑 Admin verification:", {
    hasUser: !!req.user,
    isAdmin: req.user?.isAdmin,
    email: req.user?.email,
    url: req.url,
    method: req.method
  });

  if (!req.user) {
    console.log("❌ No user in request - verifyToken should be called first");
    return res.status(401).json({ 
      message: "Authentication required. Please login first." 
    });
  }

  if (!req.user.isAdmin) {
    console.log("❌ Access denied - user is not admin:", req.user.email);
    return res.status(403).json({ 
      message: "Access denied. Administrator privileges required.",
      userEmail: req.user.email,
      isAdmin: req.user.isAdmin
    });
  }

  console.log("✅ Admin access granted:", req.user.email);
  next();
};

// ✅ Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, but that's okay for optional auth
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      isAdmin: decoded.isAdmin,
      email: decoded.email,
    };

    console.log("✅ Optional auth - user identified:", req.user.email);
    
  } catch (err) {
    // Token is invalid, but we don't fail for optional auth
    console.log("⚠️ Optional auth - invalid token ignored:", err.message);
    req.user = null;
  }

  next();
};

// ✅ Rate limiting middleware (basic implementation)
const rateLimitMap = new Map();

const createRateLimit = (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const identifier = req.ip + (req.user?.id || 'anonymous');
    const now = Date.now();
    
    if (!rateLimitMap.has(identifier)) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = rateLimitMap.get(identifier);
    
    if (now > limit.resetTime) {
      // Reset the limit
      rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (limit.count >= maxRequests) {
      console.log("🚫 Rate limit exceeded:", identifier);
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((limit.resetTime - now) / 1000)
      });
    }
    
    limit.count++;
    next();
  };
};

// ✅ Middleware to check if user owns resource or is admin
const verifyOwnershipOrAdmin = (getUserIdFromParams) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Admin can access anything
    if (req.user.isAdmin) {
      console.log("✅ Admin access granted for ownership check");
      return next();
    }

    // Get the user ID from the resource (e.g., from URL params)
    const resourceUserId = getUserIdFromParams ? getUserIdFromParams(req) : req.params.userId;

    if (req.user.id !== resourceUserId && req.user.userId !== resourceUserId) {
      console.log("❌ Ownership verification failed:", {
        requestingUser: req.user.id,
        resourceOwner: resourceUserId
      });
      return res.status(403).json({ 
        message: "Access denied. You can only access your own resources." 
      });
    }

    console.log("✅ Ownership verified for user:", req.user.email);
    next();
  };
};

module.exports = {
  verifyToken,
  verifyAdmin,
  optionalAuth,
  createRateLimit,
  verifyOwnershipOrAdmin,
  // Export individual rate limiters for common use cases
  authRateLimit: createRateLimit(5, 15 * 60 * 1000), // 5 auth attempts per 15 minutes
  apiRateLimit: createRateLimit(100, 15 * 60 * 1000), // 100 API calls per 15 minutes
};