const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  submissions: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  }
});

const skillMetricsSchema = new mongoose.Schema({
  syntax: { type: Number, default: 0, min: 0, max: 100 },
  logic: { type: Number, default: 0, min: 0, max: 100 },
  dataStructures: { type: Number, default: 0, min: 0, max: 100 },
  optimization: { type: Number, default: 0, min: 0, max: 100 }
});

const badgeSchema = new mongoose.Schema({
  name: String,
  earnedAt: { type: Date, default: Date.now },
  icon: String
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: 'Aspiring developer learning with CodeNest',
    maxlength: 200
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  streak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: String,
    default: null
  },
  activityLogs: [activityLogSchema],
  skillMetrics: {
    type: skillMetricsSchema,
    default: () => ({})
  },
  badges: [badgeSchema],
  preferredLanguage: {
    type: String,
    enum: ['java', 'python', 'javascript'],
    default: 'python'
  },
  learningGoal: {
    type: String,
    default: 'Full Stack Development'
  },
  completedTopics: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true
});

// Method to update streak
userSchema.methods.updateStreak = function() {
  const today = new Date().toISOString().split('T')[0];
  
  if (this.lastActivityDate === today) {
    return; // Already logged today
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (this.lastActivityDate === yesterdayStr) {
    this.streak += 1;
  } else if (this.lastActivityDate !== today) {
    this.streak = 1;
  }
  
  if (this.streak > this.longestStreak) {
    this.longestStreak = this.streak;
  }
  
  this.lastActivityDate = today;
};

// Method to add XP and check level up
userSchema.methods.addXP = function(points) {
  this.xp += points;
  const newLevel = Math.floor(this.xp / 500) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    return true; // Level up!
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
