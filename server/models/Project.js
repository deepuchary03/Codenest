const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    enum: ['java', 'python', 'javascript', 'cpp', 'c'],
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const executionHistorySchema = new mongoose.Schema({
  fileName: String,
  language: String,
  executionTime: Number,
  memoryUsage: Number,
  complexity: String,
  timestamp: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [fileSchema],
  activeFile: {
    type: String,
    default: null
  },
  executionHistory: [executionHistorySchema],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
projectSchema.index({ ownerId: 1 });
projectSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Project', projectSchema);
