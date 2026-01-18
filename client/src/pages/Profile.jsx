import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ArrowLeft, User, Save, Sparkles, Target, Code2 } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    user?.preferredLanguage || "python"
  );
  const [learningGoal, setLearningGoal] = useState(user?.learningGoal || "");
  const [loading, setLoading] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put("/api/auth/profile", {
        bio,
        preferredLanguage,
        learningGoal,
      });

      updateUser(response.data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    if (!learningGoal) {
      toast.error("Please set a learning goal first");
      return;
    }

    if (!preferredLanguage) {
      toast.error("Please select a preferred language first");
      return;
    }

    setGeneratingRoadmap(true);
    setShowRoadmapModal(true);

    try {
      const response = await axios.post("/api/ai/roadmap", {
        startLanguage: preferredLanguage,
        goal: learningGoal,
        currentLevel: user?.level || 1,
      });

      if (response.data.success) {
        setRoadmap(response.data);
        toast.success("Learning roadmap loaded!");
      } else {
        toast.error("Failed to load roadmap");
        setShowRoadmapModal(false);
      }
    } catch (error) {
      console.error('Roadmap error:', error);
      toast.error(error.response?.data?.error || "Failed to load roadmap");
      setShowRoadmapModal(false);
    } finally {
      setGeneratingRoadmap(false);
    }
  };

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
            <User className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-3xl font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.username}</h2>
              <p className="text-dark-muted">{user?.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="badge bg-primary/20 text-primary">
                  Level {user?.level}
                </span>
                <span className="text-dark-muted">{user?.xp} XP</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-field w-full"
                rows={3}
                maxLength={200}
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-dark-muted mt-1">
                {bio.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Preferred Language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="input-field w-full"
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Learning Goal
              </label>
              <input
                type="text"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Full Stack Development, Data Science, Game Development"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saving..." : "Save Changes"}</span>
              </button>

              <button
                type="button"
                onClick={generateRoadmap}
                className="btn-secondary flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>View My Learning Roadmap</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="text-lg font-bold mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-dark-muted text-sm">Current Streak</p>
              <p className="text-2xl font-bold text-warning">
                {user?.streak} 🔥
              </p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">Longest Streak</p>
              <p className="text-2xl font-bold">{user?.longestStreak} days</p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">Total XP</p>
              <p className="text-2xl font-bold text-primary">{user?.xp}</p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">Level</p>
              <p className="text-2xl font-bold text-success">{user?.level}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Roadmap Modal */}
      {showRoadmapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card w-full max-w-4xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Target className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold">Your Learning Roadmap</h3>
              </div>
              <button
                onClick={() => setShowRoadmapModal(false)}
                className="text-dark-muted hover:text-dark-text"
              >
                ✕
              </button>
            </div>

            {generatingRoadmap ? (
              <div className="text-center py-12">
                <div className="spinner border-4 border-primary border-t-transparent rounded-full w-12 h-12 mx-auto mb-4"></div>
                <p className="text-dark-muted">
                  Loading your learning roadmap...
                </p>
              </div>
            ) : roadmap?.data?.topics ? (
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary rounded-lg p-4 mb-6">
                  <p className="text-sm">
                    <span className="font-semibold">Language:</span> {preferredLanguage}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Goal:</span> {learningGoal}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Level:</span> Beginner
                  </p>
                </div>

                {roadmap.data.topics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-dark-bg border border-dark-border rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold flex-shrink-0">
                        {topic.order}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-2">{topic.title}</h4>
                        <p className="text-sm text-dark-muted leading-relaxed">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : roadmap ? (
              <div className="space-y-6">
                {roadmap.phases?.map((phase, index) => (
                  <div
                    key={index}
                    className="bg-dark-bg border border-dark-border rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{phase.title}</h4>
                        <p className="text-sm text-dark-muted">
                          {phase.duration}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 ml-11">
                      {phase.topics && (
                        <div>
                          <p className="text-sm font-semibold text-primary">
                            Topics:
                          </p>
                          <ul className="list-disc list-inside text-sm text-dark-muted">
                            {phase.topics.map((topic, i) => (
                              <li key={i}>{topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {phase.projects && (
                        <div>
                          <p className="text-sm font-semibold text-success">
                            Projects:
                          </p>
                          <ul className="list-disc list-inside text-sm text-dark-muted">
                            {phase.projects.map((project, i) => (
                              <li key={i}>{project}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {roadmap.milestones && roadmap.milestones.length > 0 && (
                  <div className="bg-dark-bg border border-primary rounded-lg p-4">
                    <h4 className="font-bold mb-3 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-primary" />
                      Key Milestones
                    </h4>
                    <div className="space-y-2">
                      {roadmap.milestones.map((milestone, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <span className="badge bg-primary/20 text-primary">
                            Week {milestone.week}
                          </span>
                          <span className="text-sm">
                            {milestone.achievement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
