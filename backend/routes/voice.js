const express = require("express");
const router = express.Router();
const { createClient } = require("@deepgram/sdk");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/auth");
const User = require("../models/User");
const { getPlanLimits } = require("../utils/plans");

const voiceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// Deepgram Token Proxy
router.get("/token", requireAuth, voiceLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const limits = getPlanLimits(user.plan || "free");
    const currentMinutes = user.usage?.voice_minutes || 0;
    if (currentMinutes >= limits.voice_minutes) {
      return res.status(429).json({ error: "Voice usage limit reached" });
    }

    const key = process.env.DEEPGRAM_API_KEY;
    const projectId = process.env.DEEPGRAM_PROJECT_ID;
    if (!key) {
      return res.status(500).json({ error: "Deepgram API Key not configured" });
    }
    if (!projectId) {
      return res
        .status(500)
        .json({ error: "Deepgram Project ID not configured" });
    }

    const deepgram = createClient(key);

    // Create a temporary, short-lived key
    const { result, error } = await deepgram.manage.createProjectKey(
      projectId,
      {
        comment: "Temporary CoderSpeak token",
        scopes: ["usage:runtime"],
        time_to_live_in_seconds: 60,
      },
    );

    if (error) {
      console.error("[Deepgram Proxy Error]", error);
      return res.status(500).json({ error: "Failed to generate token" });
    }

    user.usage.voice_minutes = currentMinutes + 1;
    user.usage.updated_at = new Date();
    await user.save();

    res.json({
      token: result.key,
      remaining_minutes: limits.voice_minutes - user.usage.voice_minutes,
    });
  } catch (err) {
    console.error("[Deepgram Proxy Error]", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
