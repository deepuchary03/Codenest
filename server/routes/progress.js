const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user's completed topics
router.get('/completed', authMiddleware, async (req, res) => {
  try {
    const completedTopics = req.user.completedTopics || [];
    res.json({ success: true, completedTopics });
  } catch (error) {
    console.error('Error fetching completed topics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch progress' });
  }
});

// Mark topic as completed
router.post('/complete', authMiddleware, async (req, res) => {
  try {
    const { topicOrder, topicTitle } = req.body;

    if (!topicOrder || !topicTitle) {
      return res.status(400).json({ error: 'Topic order and title are required' });
    }

    // Initialize completedTopics array if it doesn't exist
    if (!req.user.completedTopics) {
      req.user.completedTopics = [];
    }

    // Add topic if not already completed
    if (!req.user.completedTopics.includes(topicOrder)) {
      req.user.completedTopics.push(topicOrder);
      
      // Award XP for completing a topic
      req.user.addXP(50);
      
      await req.user.save();

      res.json({
        success: true,
        message: `Completed: ${topicTitle}`,
        completedTopics: req.user.completedTopics,
        xpGained: 50,
        newXP: req.user.xp,
        newLevel: req.user.level
      });
    } else {
      res.json({
        success: true,
        message: 'Topic already completed',
        completedTopics: req.user.completedTopics
      });
    }
  } catch (error) {
    console.error('Error marking topic complete:', error);
    res.status(500).json({ success: false, error: 'Failed to update progress' });
  }
});

module.exports = router;
