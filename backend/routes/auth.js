const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'codeforge_super_secret_key_change_me';

// Register User
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already in use' });
    }

    const user = new User({ email, password, username });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: user.toPublic(),
      token
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: user.toPublic(),
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current User (Session verification)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Update Profile
router.patch('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { username, email, password, avatar_url, bio, website, social_links, preferences } = req.body;
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (social_links) user.social_links = { ...user.social_links.toObject(), ...social_links };
    if (preferences) user.preferences = { ...user.preferences.toObject(), ...preferences };

    await user.save();
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Public Profile
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch public snippets for this user
    const Snippet = require('../models/Snippet'); // Lazy load to avoid circular dependency
    const snippets = await Snippet.find({ user_id: user._id, is_public: true })
      .sort({ created_at: -1 })
      .limit(20);

    res.json({
      user: user.toPublic(),
      snippets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
