const express = require("express");
const router = express.Router();
const Snippet = require("../models/Snippet");
const { checkAndAwardAchievements } = require("../utils/achievements");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const User = require("../models/User");
const { getPlanLimits } = require("../utils/plans");
const Workspace = require("../models/Workspace");

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10)
    .map((tag) => tag.slice(0, 20));
}

function validateSnippetInput(
  { title, language, code, tags },
  isUpdate = false,
) {
  if (!isUpdate) {
    if (!title || !language || !code)
      return "Title, language, and code are required";
  }
  if (title && title.length > 100) return "Title cannot exceed 100 characters";
  if (code && code.length > 50000)
    return "Code cannot exceed 50,000 characters";
  if (language && language.length > 40) return "Language is invalid";
  if (tags && !Array.isArray(tags)) return "Tags must be an array";
  return null;
}

async function canAccessWorkspace(workspaceId, userId) {
  if (!workspaceId) return true;
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return false;
  const isMember = workspace.members.some(
    (m) => m.user_id.toString() === userId,
  );
  return isMember || workspace.owner_id.toString() === userId;
}

// Get All Public Snippets (Global Gallery)
router.get("/feed/public", async (req, res) => {
  try {
    const snippets = await Snippet.find({ is_public: true })
      .sort({ created_at: -1 })
      .limit(50);
    res.json(snippets.map((s) => s.toPublic()));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public feed" });
  }
});

// Get User Snippets (with search and filter)
router.get("/", requireAuth, async (req, res) => {
  try {
    const { search, language, tag } = req.query;
    const workspaceId = req.query.workspace_id || null;
    if (workspaceId && !(await canAccessWorkspace(workspaceId, req.userId))) {
      return res.status(403).json({ error: "Workspace access denied" });
    }
    let query = { user_id: req.userId };
    if (workspaceId) {
      query.workspace_id = workspaceId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }
    if (language && language !== "all") {
      query.language = language;
    }
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    const snippets = await Snippet.find(query).sort({ created_at: -1 });
    res.json(snippets.map((s) => s.toPublic()));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
});

// Get User Snippets (dashboard summary)
router.get("/my-snippets", requireAuth, async (req, res) => {
  try {
    const workspaceId = req.query.workspace_id || null;
    if (workspaceId && !(await canAccessWorkspace(workspaceId, req.userId))) {
      return res.status(403).json({ error: "Workspace access denied" });
    }
    const query = { user_id: req.userId };
    if (workspaceId) query.workspace_id = workspaceId;
    const snippets = await Snippet.find(query).sort({ updated_at: -1 });
    res.json({ snippets: snippets.map((s) => s.toPublic()) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
});

// Get Single Snippet (Public or Owned)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });

    if (
      snippet.workspace_id &&
      (!req.userId ||
        !(await canAccessWorkspace(snippet.workspace_id, req.userId)))
    ) {
      return res.status(403).json({ error: "Workspace access denied" });
    }

    // Check if public or if if user is owner
    if (!snippet.is_public) {
      if (!req.userId)
        return res.status(401).json({ error: "This snippet is private" });
      if (snippet.user_id.toString() !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    res.json(snippet.toPublic());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch snippet" });
  }
});

// Save Snippet
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, language, code, is_public, tags, workspace_id } = req.body;
    const validationError = validateSnippetInput({
      title,
      language,
      code,
      tags,
    });
    if (validationError)
      return res.status(400).json({ error: validationError });
    if (workspace_id && !(await canAccessWorkspace(workspace_id, req.userId))) {
      return res.status(403).json({ error: "Workspace access denied" });
    }
    const snippet = new Snippet({
      user_id: req.userId,
      workspace_id: workspace_id || null,
      title,
      language,
      code,
      is_public: is_public ?? false,
      tags: normalizeTags(tags),
    });
    await snippet.save();
    await checkAndAwardAchievements(req.userId);
    res.status(201).json(snippet.toPublic());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Snippet
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { title, language, code, is_public, tags, workspace_id } = req.body;
    const validationError = validateSnippetInput(
      { title, language, code, tags },
      true,
    );
    if (validationError)
      return res.status(400).json({ error: validationError });
    const snippet = await Snippet.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });

    if (workspace_id && !(await canAccessWorkspace(workspace_id, req.userId))) {
      return res.status(403).json({ error: "Workspace access denied" });
    }

    if (title) snippet.title = title;
    if (language) snippet.language = language;
    if (code) snippet.code = code;
    if (is_public !== undefined) snippet.is_public = is_public;
    if (tags) snippet.tags = normalizeTags(tags);
    if (workspace_id !== undefined) snippet.workspace_id = workspace_id || null;

    await snippet.save();
    res.json(snippet.toPublic());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Snippet
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndDelete({
      _id: req.params.id,
      user_id: req.userId,
    });
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json({ message: "Snippet deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// Toggle Like Snippet
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });

    if (
      snippet.workspace_id &&
      !(await canAccessWorkspace(snippet.workspace_id, req.userId))
    ) {
      return res.status(403).json({ error: "Workspace access denied" });
    }

    if (!snippet.is_public && snippet.user_id.toString() !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const likeIndex = snippet.likes.indexOf(req.userId);
    if (likeIndex > -1) {
      snippet.likes.splice(likeIndex, 1);
    } else {
      snippet.likes.push(req.userId);
    }

    await snippet.save();
    // Award achievement to the snippet owner
    await checkAndAwardAchievements(snippet.user_id);
    res.json({ likes: snippet.likes.length, isLiked: likeIndex === -1 });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// Increment Run Count
router.post("/:id/run", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const limits = getPlanLimits(user.plan || "free");
    const currentRuns = user.usage?.compiler_runs || 0;
    if (currentRuns >= limits.compiler_runs) {
      return res.status(429).json({ error: "Compiler run limit reached" });
    }

    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });

    if (
      snippet.workspace_id &&
      !(await canAccessWorkspace(snippet.workspace_id, req.userId))
    ) {
      return res.status(403).json({ error: "Workspace access denied" });
    }

    if (!snippet.is_public && snippet.user_id.toString() !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    snippet.run_count += 1;
    await snippet.save();

    user.usage.compiler_runs = currentRuns + 1;
    user.usage.updated_at = new Date();
    await user.save();

    res.json({
      run_count: snippet.run_count,
      remaining_runs: limits.compiler_runs - user.usage.compiler_runs,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to increment run count" });
  }
});

module.exports = router;
