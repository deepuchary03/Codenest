const express = require("express");
const axios = require("axios");
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// Piston API endpoint (free alternative to Judge0)
const PISTON_API = "https://emkc.org/api/v2/piston";

// Language mapping
const languageMap = {
  java: { language: "java", version: "15.0.2" },
  python: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
  cpp: { language: "c++", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
};

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    const langConfig = languageMap[language];
    if (!langConfig) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    const startTime = Date.now();

    // Execute code via Piston API
    const response = await axios.post(`${PISTON_API}/execute`, {
      language: langConfig.language,
      version: langConfig.version,
      files: [
        {
          name: language === "java" ? "Main.java" : `main.${language}`,
          content: code,
        },
      ],
      stdin: input || "",
      args: [],
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    });

    const result = response.data;

    // Get actual execution time from Piston API (in milliseconds)
    // Piston provides compile.code and run.code along with actual execution time
    const compileTime =
      result.compile?.code !== undefined ? result.compile.time || 0 : 0;
    const runTime = result.run?.code !== undefined ? result.run.time || 0 : 0;

    // Use actual execution time, not network round-trip time
    const executionTime = Math.round(runTime);
    const totalTime = Math.round(compileTime + runTime);

    // Calculate estimated memory (convert bytes to MB if available)
    const estimatedMemory = result.run?.memory
      ? (result.run.memory / (1024 * 1024)).toFixed(2)
      : (code.length / 1024 / 1024).toFixed(2);

    // Update user activity
    const today = new Date().toISOString().split("T")[0];
    req.user.updateStreak();

    const activityLog = req.user.activityLogs.find((log) => log.date === today);
    if (activityLog) {
      activityLog.submissions += 1;
      activityLog.points += 10;
    } else {
      req.user.activityLogs.push({
        date: today,
        submissions: 1,
        points: 10,
      });
    }

    // Award XP
    const leveledUp = req.user.addXP(10);
    req.user.skillMetrics.syntax = Math.min(
      100,
      req.user.skillMetrics.syntax + 1
    );

    await req.user.save();

    // Determine if execution was successful
    const hasCompileError =
      result.compile?.stderr && result.compile.stderr.trim().length > 0;
    const hasRuntimeError =
      result.run?.stderr && result.run.stderr.trim().length > 0;
    const isSuccess = !hasCompileError && !hasRuntimeError;

    // Get output (stdout or stderr)
    let output = "";
    let error = null;

    if (result.compile?.stderr) {
      error = result.compile.stderr;
      output = `Compilation Error:\n${error}`;
    } else if (result.run?.stderr) {
      error = result.run.stderr;
      output = `Runtime Error:\n${error}`;
    } else {
      output =
        result.run?.stdout ||
        result.compile?.stdout ||
        "Program executed successfully with no output.";
    }

    res.json({
      output: output.trim(),
      error: error,
      executionTime,
      memoryUsage: parseFloat(estimatedMemory),
      success: isSuccess,
      leveledUp,
      xpGained: 10,
      newLevel: req.user.level,
    });
  } catch (error) {
    console.error(
      "Code execution error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to execute code",
      details: error.response?.data?.message || error.message,
    });
  }
});

// Get supported languages
router.get("/languages", async (req, res) => {
  try {
    res.json({
      languages: Object.keys(languageMap).map((key) => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        ...languageMap[key],
      })),
    });
  } catch (error) {
    console.error("Get languages error:", error);
    res.status(500).json({ error: "Failed to fetch languages" });
  }
});

module.exports = router;
