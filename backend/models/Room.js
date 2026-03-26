const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  state: {
    type: Buffer, // Stores the Yjs document state as binary
    required: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
