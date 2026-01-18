import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  Flame,
  Target,
  Award,
  Code2,
  Calendar,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await axios.get("/api/analytics");
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate heatmap data for last 365 days
  const generateHeatmapData = () => {
    if (!analytics?.activityData) return [];

    const data = [];
    const today = new Date();
    const months = [];

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const activity = analytics.activityData.find((a) => a.date === dateStr);
      const weekIndex = Math.floor((364 - i) / 7);
      
      // Track first occurrence of each month
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      if (date.getDate() === 1 || (i === 364)) {
        months.push({ month: monthName, week: weekIndex });
      }

      data.push({
        date: dateStr,
        day: date.getDay(),
        week: weekIndex,
        submissions: activity?.submissions || 0,
        points: activity?.points || 0,
      });
    }

    return { data, months };
  };

  const getIntensityColor = (submissions) => {
    if (submissions === 0) return "#1f2937"; // Lighter gray for empty boxes
    if (submissions <= 2) return "#0e4429";
    if (submissions <= 5) return "#006d32";
    if (submissions <= 10) return "#26a641";
    return "#39d353";
  };

  const skillData = analytics?.user?.skillMetrics
    ? [
        { skill: "Syntax", value: analytics.user.skillMetrics.syntax },
        { skill: "Logic", value: analytics.user.skillMetrics.logic },
        {
          skill: "Data Structures",
          value: analytics.user.skillMetrics.dataStructures,
        },
        {
          skill: "Optimization",
          value: analytics.user.skillMetrics.optimization,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner border-4 border-primary border-t-transparent rounded-full w-12 h-12"></div>
      </div>
    );
  }

  const heatmapResult = generateHeatmapData();
  const heatmapData = heatmapResult.data || [];
  const monthLabels = heatmapResult.months || [];

  // Group heatmap data by month, preserving week structure
  const groupedByMonth = heatmapData.reduce((acc, item) => {
    const date = new Date(item.date);
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Analytics</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-muted text-sm mb-1">Current Streak</p>
                <p className="text-3xl font-bold">
                  {analytics?.user?.streak} days
                </p>
              </div>
              <Flame className="w-10 h-10 text-warning" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-muted text-sm mb-1">Longest Streak</p>
                <p className="text-3xl font-bold">
                  {analytics?.user?.longestStreak} days
                </p>
              </div>
              <Target className="w-10 h-10 text-primary" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-muted text-sm mb-1">Total Projects</p>
                <p className="text-3xl font-bold">
                  {analytics?.stats?.totalProjects}
                </p>
              </div>
              <Code2 className="w-10 h-10 text-success" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-muted text-sm mb-1">Code Runs</p>
                <p className="text-3xl font-bold">
                  {analytics?.stats?.totalExecutions}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-error" />
            </div>
          </motion.div>
        </div>

        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card mb-8"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Contribution Heatmap</h2>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-2">
              {/* Day labels on the left */}
              <div className="flex flex-col justify-around text-xs text-dark-muted py-4">
                <span className="h-3">Mon</span>
                <span className="h-3">Wed</span>
                <span className="h-3">Fri</span>
              </div>

              {/* Month-wise columns */}
              <div className="flex gap-4">
                {Object.entries(groupedByMonth).map(([monthYear, days]) => (
                  <div key={monthYear} className="flex flex-col">
                    {/* Month Label */}
                    <span className="text-xs text-dark-muted mb-1">{monthYear.split(' ')[0]}</span>

                    {/* Days grid - weeks horizontal, days vertical */}
                    <div
                      className="grid auto-cols-max gap-1"
                      style={{
                        gridTemplateRows: "repeat(7, 14px)",
                        gridAutoFlow: "column",
                      }}
                    >
                      {days.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all border border-dark-border/30"
                          style={{
                            width: "14px",
                            height: "14px",
                            backgroundColor: getIntensityColor(item.submissions),
                          }}
                          title={`${item.date}: ${item.submissions} submissions, ${item.points} points`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end space-x-2 mt-4 text-xs text-dark-muted">
              <span>Less</span>
              {[0, 1, 3, 6, 11].map((val) => (
                <div
                  key={val}
                  className="rounded-sm border border-dark-border/50"
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor: getIntensityColor(val),
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </motion.div>

        {/* Skill Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold mb-6">Skill Radar</h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={skillData}>
              <PolarGrid stroke="#30363d" />
              <PolarAngleAxis dataKey="skill" stroke="#8b949e" />
              <Radar
                name="Skills"
                dataKey="value"
                stroke="#58a6ff"
                fill="#58a6ff"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Badges */}
        {analytics?.user?.badges && analytics.user.badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Earned Badges</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.user.badges.map((badge, index) => (
                <div
                  key={index}
                  className="text-center p-4 bg-dark-bg rounded-lg border border-dark-border"
                >
                  <div className="text-4xl mb-2">{badge.icon || "🏆"}</div>
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-dark-muted mt-1">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
