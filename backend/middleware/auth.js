const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "codeforge_super_secret_key_change_me";

function getToken(req) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

function optionalAuth(req, res, next) {
  const token = getToken(req);
  if (!token || !JWT_SECRET) {
    req.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
  } catch (err) {
    req.userId = null;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
