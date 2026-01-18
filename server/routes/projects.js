const express = require('express');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all projects for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ ownerId: req.user._id })
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Fetch project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, language } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    // Create default file based on language
    const defaultFiles = {
      java: {
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeNest!");
    }
}`,
        language: 'java'
      },
      python: {
        name: 'main.py',
        content: `# Welcome to CodeNest!\nprint("Hello, CodeNest!")`,
        language: 'python'
      },
      javascript: {
        name: 'index.js',
        content: `// Welcome to CodeNest!\nconsole.log("Hello, CodeNest!");`,
        language: 'javascript'
      }
    };
    
    const project = new Project({
      name,
      description: description || '',
      ownerId: req.user._id,
      files: [defaultFiles[language] || defaultFiles.python],
      activeFile: defaultFiles[language]?.name || 'main.py'
    });
    
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project (files, active file, etc.)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const { files, activeFile, name, description } = req.body;
    
    if (files) project.files = files;
    if (activeFile) project.activeFile = activeFile;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    
    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add execution history
router.post('/:id/execution', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const { fileName, language, executionTime, memoryUsage, complexity } = req.body;
    
    project.executionHistory.push({
      fileName,
      language,
      executionTime,
      memoryUsage,
      complexity
    });
    
    // Keep only last 50 executions
    if (project.executionHistory.length > 50) {
      project.executionHistory = project.executionHistory.slice(-50);
    }
    
    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Add execution error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
