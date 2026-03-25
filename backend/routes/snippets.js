const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Snippet = require('../models/Snippet');
const { checkAndAwardAchievements } = require('../utils/achievements');

const JWT_SECRET = process.env.JWT_SECRET || 'codeforge_super_secret_key_change_me';

// Auth Middleware
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get User Snippets (with search and filter)
router.get('/', protect, async (req, res) => {
  try {
    const { search, language, tag } = req.query;
    let query = { user_id: req.userId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (language && language !== 'all') {
      query.language = language;
    }
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    const snippets = await Snippet.find(query).sort({ created_at: -1 });
    res.json(snippets.map(s => s.toPublic()));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});

// Get Single Snippet (Public or Owned)
router.get('/:id', async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });

    // Check if public or if if user is owner
    if (!snippet.is_public) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'This snippet is private' });

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (snippet.user_id.toString() !== decoded.id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    res.json(snippet.toPublic());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch snippet' });
  }
});

// Save Snippet
router.post('/', protect, async (req, res) => {
  try {
    const { title, language, code, is_public, tags } = req.body;
    const snippet = new Snippet({
      user_id: req.userId,
      title,
      language,
      code,
      is_public: is_public ?? false,
      tags: tags || [],
    });
    await snippet.save();
    await checkAndAwardAchievements(req.userId);
    res.status(201).json(snippet.toPublic());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Snippet
router.patch('/:id', protect, async (req, res) => {
  try {
    const { title, language, code, is_public, tags } = req.body;
    const snippet = await Snippet.findOne({ _id: req.params.id, user_id: req.userId });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });

    if (title) snippet.title = title;
    if (language) snippet.language = language;
    if (code) snippet.code = code;
    if (is_public !== undefined) snippet.is_public = is_public;
    if (tags) snippet.tags = tags;

    await snippet.save();
    res.json(snippet.toPublic());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Snippet
router.delete('/:id', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndDelete({ _id: req.params.id, user_id: req.userId });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
    res.json({ message: 'Snippet deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Get All Public Snippets (Global Gallery)
router.get('/feed/public', async (req, res) => {
  try {
    const snippets = await Snippet.find({ is_public: true })
      .sort({ created_at: -1 })
      .limit(50);
    res.json(snippets.map(s => s.toPublic()));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public feed' });
  }
});

// Toggle Like Snippet
router.post('/:id/like', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });

    const likeIndex = snippet.likes.indexOf(req.userId);
    if (likeIndex > -1) {
      snippet.likes.splice(likeIndex, 1);
    } else {
      snippet.likes.push(req.userId);
    }

    await snippet.save();
    // Award achievement to the snippet owner
    await checkAndAwardAchievements(snippet.user_id);
    res.json({ likes: snippet.likes.length, isLiked: (likeIndex === -1) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

module.exports = router;
