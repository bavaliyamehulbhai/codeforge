const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    joined_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

workspaceSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    owner_id: this.owner_id.toString(),
    members: this.members.map((m) => ({
      user_id: m.user_id?._id ? m.user_id._id.toString() : m.user_id.toString(),
      user: m.user_id?._id
        ? {
            id: m.user_id._id.toString(),
            username: m.user_id.username,
            avatar_url: m.user_id.avatar_url,
          }
        : null,
      role: m.role,
      joined_at: m.joined_at.toISOString(),
    })),
    created_at: this.created_at.toISOString(),
    updated_at: this.updated_at.toISOString(),
  };
};

module.exports = mongoose.model("Workspace", workspaceSchema);
