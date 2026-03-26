const express = require("express");
const router = express.Router();
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

function normalizeName(name) {
  return String(name || "").trim();
}

function isValidName(name) {
  const trimmed = normalizeName(name);
  return trimmed.length >= 3 && trimmed.length <= 50;
}

function getMember(workspace, userId) {
  return workspace.members.find((m) => m.user_id.toString() === userId);
}

function isAdmin(member) {
  return member && (member.role === "owner" || member.role === "admin");
}

// List workspaces for current user
router.get("/", requireAuth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner_id: req.userId }, { "members.user_id": req.userId }],
    })
      .sort({ updated_at: -1 })
      .populate("members.user_id", "username avatar_url");

    res.json(workspaces.map((w) => w.toPublic()));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
});

// Create workspace
router.post("/", requireAuth, async (req, res) => {
  try {
    const name = normalizeName(req.body.name);
    if (!isValidName(name))
      return res
        .status(400)
        .json({ error: "Workspace name must be 3-50 characters" });

    const workspace = new Workspace({
      name,
      owner_id: req.userId,
      members: [{ user_id: req.userId, role: "owner" }],
    });

    await workspace.save();
    await workspace.populate("members.user_id", "username avatar_url");
    res.status(201).json(workspace.toPublic());
  } catch (err) {
    res.status(500).json({ error: "Failed to create workspace" });
  }
});

// Add member by username
router.post("/:id/members", requireAuth, async (req, res) => {
  try {
    const { username, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace)
      return res.status(404).json({ error: "Workspace not found" });

    const member = getMember(workspace, req.userId);
    if (!isAdmin(member))
      return res.status(403).json({ error: "Insufficient permissions" });

    const target = await User.findOne({
      username: String(username || "").toLowerCase(),
    });
    if (!target) return res.status(404).json({ error: "User not found" });

    if (
      workspace.members.some(
        (m) => m.user_id.toString() === target._id.toString(),
      )
    ) {
      return res.status(400).json({ error: "User is already a member" });
    }

    const normalizedRole = ["admin", "member"].includes(role) ? role : "member";
    workspace.members.push({ user_id: target._id, role: normalizedRole });
    await workspace.save();
    await workspace.populate("members.user_id", "username avatar_url");

    res.json(workspace.toPublic());
  } catch (err) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Remove member (owner/admin or self leave)
router.delete("/:id/members/:userId", requireAuth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace)
      return res.status(404).json({ error: "Workspace not found" });

    const requester = getMember(workspace, req.userId);
    const isSelf = req.userId === req.params.userId;
    if (!isSelf && !isAdmin(requester))
      return res.status(403).json({ error: "Insufficient permissions" });

    if (workspace.owner_id.toString() === req.params.userId) {
      return res.status(400).json({ error: "Owner cannot be removed" });
    }

    workspace.members = workspace.members.filter(
      (m) => m.user_id.toString() !== req.params.userId,
    );
    await workspace.save();
    await workspace.populate("members.user_id", "username avatar_url");
    res.json(workspace.toPublic());
  } catch (err) {
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// Update member role
router.patch("/:id/members/:userId", requireAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace)
      return res.status(404).json({ error: "Workspace not found" });

    const requester = getMember(workspace, req.userId);
    if (!isAdmin(requester))
      return res.status(403).json({ error: "Insufficient permissions" });

    const target = getMember(workspace, req.params.userId);
    if (!target) return res.status(404).json({ error: "Member not found" });

    if (target.role === "owner") {
      return res.status(400).json({ error: "Owner role cannot be changed" });
    }

    const normalizedRole = ["admin", "member"].includes(role) ? role : null;
    if (!normalizedRole) return res.status(400).json({ error: "Invalid role" });

    target.role = normalizedRole;
    await workspace.save();
    await workspace.populate("members.user_id", "username avatar_url");

    res.json(workspace.toPublic());
  } catch (err) {
    res.status(500).json({ error: "Failed to update member role" });
  }
});

module.exports = router;
