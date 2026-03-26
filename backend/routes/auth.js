const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { getPlanLimits } = require("../utils/plans");

const JWT_SECRET =
  process.env.JWT_SECRET || "codeforge_super_secret_key_change_me";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const emailRegex = /^\S+@\S+\.\S+$/;
const usernameRegex = /^[a-z0-9_]+$/;

function validateSignup({ email, password, username }) {
  if (!email || !password || !username)
    return "Email, password, and username are required";
  if (!emailRegex.test(email)) return "Please enter a valid email";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (username.length < 3 || username.length > 30)
    return "Username must be 3-30 characters";
  if (!usernameRegex.test(username))
    return "Username can only contain lowercase letters, numbers, and underscores";
  return null;
}

function validateLogin({ email, password }) {
  if (!email || !password) return "Email and password are required";
  if (!emailRegex.test(email)) return "Please enter a valid email";
  return null;
}

function validateProfileUpdate({ username, email, password, bio }) {
  if (email && !emailRegex.test(email)) return "Please enter a valid email";
  if (password && password.length < 8)
    return "Password must be at least 8 characters";
  if (username) {
    if (username.length < 3 || username.length > 30)
      return "Username must be 3-30 characters";
    if (!usernameRegex.test(username))
      return "Username can only contain lowercase letters, numbers, and underscores";
  }
  if (bio && bio.length > 200) return "Bio cannot exceed 200 characters";
  return null;
}

// Register User
router.post("/signup", authLimiter, async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const normalizedEmail = String(email || "")
      .toLowerCase()
      .trim();
    const normalizedUsername = username?.toLowerCase();
    const validationError = validateSignup({
      email: normalizedEmail,
      password,
      username: normalizedUsername,
    });
    if (validationError)
      return res.status(400).json({ error: validationError });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or username already in use" });
    }

    const user = new User({
      email: normalizedEmail,
      password,
      username: normalizedUsername,
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      user: user.toPublic(),
      token,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login User
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "")
      .toLowerCase()
      .trim();
    const validationError = validateLogin({ email: normalizedEmail, password });
    if (validationError)
      return res.status(400).json({ error: validationError });

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    user.last_active = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      user: user.toPublic(),
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Current User (Session verification)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    user.last_active = new Date();
    await user.save();

    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// Update Profile
router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      avatar_url,
      bio,
      website,
      social_links,
      preferences,
    } = req.body;
    const validationError = validateProfileUpdate({
      username,
      email,
      password,
      bio,
    });
    if (validationError)
      return res.status(400).json({ error: validationError });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (username) {
      const normalizedUsername = username.toLowerCase();
      const existingUsername = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: user._id },
      });
      if (existingUsername)
        return res.status(400).json({ error: "Username already in use" });
    }

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const existingEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (existingEmail)
        return res.status(400).json({ error: "Email already in use" });
    }

    if (username) user.username = username.toLowerCase();
    if (email) user.email = email.toLowerCase();
    if (password) user.password = password;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (social_links)
      user.social_links = { ...user.social_links.toObject(), ...social_links };
    if (preferences)
      user.preferences = { ...user.preferences.toObject(), ...preferences };

    await user.save();
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Public Profile
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch public snippets for this user
    const Snippet = require("../models/Snippet"); // Lazy load to avoid circular dependency
    const snippets = await Snippet.find({ user_id: user._id, is_public: true })
      .sort({ created_at: -1 })
      .limit(20);

    res.json({
      user: user.toPublic(),
      snippets: snippets.map((s) => s.toPublic()),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Usage and Plan Limits
router.get("/usage", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const plan = user.plan || "free";
    const limits = getPlanLimits(plan);
    res.json({
      plan,
      usage: {
        compiler_runs: user.usage?.compiler_runs || 0,
        voice_minutes: user.usage?.voice_minutes || 0,
        updated_at: user.usage?.updated_at
          ? user.usage.updated_at.toISOString()
          : null,
      },
      limits,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

module.exports = router;
