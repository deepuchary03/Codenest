const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user analytics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get project stats
    const projects = await Project.find({ ownerId: req.user._id });
    const totalFiles = projects.reduce((sum, p) => sum + p.files.length, 0);
    const totalExecutions = projects.reduce((sum, p) => sum + p.executionHistory.length, 0);
    
    // Calculate language distribution
    const languageStats = {};
    projects.forEach(project => {
      project.files.forEach(file => {
        languageStats[file.language] = (languageStats[file.language] || 0) + 1;
      });
    });
    
    // Get recent activity (last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    
    const activityData = user.activityLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= oneYearAgo;
    });
    
    res.json({
      user: {
        username: user.username,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        longestStreak: user.longestStreak,
        bio: user.bio,
        badges: user.badges,
        skillMetrics: user.skillMetrics
      },
      stats: {
        totalProjects: projects.length,
        totalFiles,
        totalExecutions,
        languageStats
      },
      activityData,
      recentProjects: projects.slice(0, 5).map(p => ({
        id: p._id,
        name: p.name,
        updatedAt: p.updatedAt,
        fileCount: p.files.length
      }))
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Update skill metrics manually (for admin/testing)
router.put('/skills', authMiddleware, async (req, res) => {
  try {
    const { syntax, logic, dataStructures, optimization } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (syntax !== undefined) user.skillMetrics.syntax = Math.min(100, Math.max(0, syntax));
    if (logic !== undefined) user.skillMetrics.logic = Math.min(100, Math.max(0, logic));
    if (dataStructures !== undefined) user.skillMetrics.dataStructures = Math.min(100, Math.max(0, dataStructures));
    if (optimization !== undefined) user.skillMetrics.optimization = Math.min(100, Math.max(0, optimization));
    
    await user.save();
    
    res.json(user.skillMetrics);
  } catch (error) {
    console.error('Skill update error:', error);
    res.status(500).json({ error: 'Failed to update skills' });
  }
});

// Award badge
router.post('/badge', authMiddleware, async (req, res) => {
  try {
    const { name, icon } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Check if badge already exists
    const existingBadge = user.badges.find(b => b.name === name);
    if (existingBadge) {
      return res.status(400).json({ error: 'Badge already earned' });
    }
    
    user.badges.push({ name, icon });
    await user.save();
    
    res.json({ message: 'Badge awarded!', badges: user.badges });
  } catch (error) {
    console.error('Badge award error:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// Get leaderboard (top users by XP)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topUsers = await User.find()
      .select('username xp level streak badges')
      .sort({ xp: -1 })
      .limit(limit);
    
    res.json(topUsers);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
