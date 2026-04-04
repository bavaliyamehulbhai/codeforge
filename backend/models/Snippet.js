const mongoose = require('mongoose')

const snippetSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Snippet title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    trim: true,
    lowercase: true,
  },
  code: {
    type: String,
    required: [true, 'Code content is required'],
    maxlength: [50000, 'Code cannot exceed 50,000 characters'],
  },
  is_public: {
    type: Boolean,
    default: false,
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  run_count: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})

// High-Performance Neural Indices
snippetSchema.index({ is_public: 1, created_at: -1 });
snippetSchema.index({ language: 1 });
snippetSchema.index({ title: 'text' });

// Transform output to match frontend Snippet type
snippetSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    user_id: this.user_id.toString(),
    title: this.title,
    language: this.language,
    code: this.code,
    is_public: this.is_public,
    likes: this.likes.length,
    run_count: this.run_count,
    created_at: this.created_at.toISOString(),
    updated_at: this.updated_at.toISOString(),
  }
}

module.exports = mongoose.model('Snippet', snippetSchema)
