const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Never return password in queries by default
  },
  avatar_url: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  social_links: {
    github: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
  },
  preferences: {
    theme: { type: String, default: 'vs-dark' },
    fontSize: { type: Number, default: 14 },
    autoSave: { type: Boolean, default: true },
    tabSize: { type: Number, default: 2 },
  },
  last_active: {
    type: Date,
    default: Date.now,
  },
  streak_count: {
    type: Number,
    default: 0,
  },
  achievements: [{
    id: String,
    name: String,
    icon: String,
    earned_at: { type: Date, default: Date.now },
  }],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Transform output to match frontend User type
userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    username: this.username,
    avatar_url: this.avatar_url,
    bio: this.bio,
    website: this.website,
    social_links: this.social_links,
    preferences: this.preferences,
    streak_count: this.streak_count,
    achievements: this.achievements || [],
    last_active: this.last_active ? this.last_active.toISOString() : null,
    created_at: this.created_at.toISOString(),
  }
}

module.exports = mongoose.model('User', userSchema)
