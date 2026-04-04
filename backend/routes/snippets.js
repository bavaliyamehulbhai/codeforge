const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Snippet = require('../models/Snippet');
const NodeCache = require('node-cache');

const JWT_SECRET = process.env.JWT_SECRET || 'codeforge_super_secret_key_change_me';

// Neural Cache (30s TTL for public feed)
const neuralCache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

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
    const { search, language } = req.query;
    let query = { user_id: req.userId };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (language && language !== 'all') {
      query.language = language;
    }

    const snippets = await Snippet.find(query).sort({ created_at: -1 }).lean();
    res.json(snippets.map(s => {
      const ps = { ...s, id: s._id };
      delete ps._id;
      delete ps.__v;
      return ps;
    }));
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
    const { title, language, code, is_public } = req.body;
    const snippet = new Snippet({
      user_id: req.userId,
      title,
      language,
      code,
      is_public: is_public ?? false,
    });
    await snippet.save();
    res.status(201).json(snippet.toPublic());
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
    const cacheKey = 'public_feed';
    const cachedFeed = neuralCache.get(cacheKey);
    if (cachedFeed) return res.json(cachedFeed);

    const snippets = await Snippet.find({ is_public: true })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    
    const publicSnippets = snippets.map(s => {
      const ps = { ...s, id: s._id };
      delete ps._id;
      delete ps.__v;
      return ps;
    });

    neuralCache.set(cacheKey, publicSnippets);
    res.json(publicSnippets);
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
    res.json({ likes: snippet.likes.length, isLiked: (likeIndex === -1) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

module.exports = router;
