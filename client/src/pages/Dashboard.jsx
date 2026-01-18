import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Code2,
  Plus,
  Folder,
  Trash2,
  TrendingUp,
  User,
  LogOut,
  Flame,
  Target,
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  X,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import AIAssistant from "../components/AIAssistant";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { projects, loadProjects, createProject, deleteProject } =
    useWorkspace();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLang, setNewProjectLang] = useState("python");
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonContent, setLessonContent] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [completedTopics, setCompletedTopics] = useState([]);

  useEffect(() => {
    loadProjects();
    loadRoadmap();
    loadCompletedTopics();
  }, []);

  const loadCompletedTopics = async () => {
    try {
      const response = await axios.get("/api/progress/completed");
      if (response.data.success) {
        setCompletedTopics(response.data.completedTopics);
      }
    } catch (error) {
      console.error('Failed to load completed topics:', error);
    }
  };

  const loadRoadmap = async () => {
    try {
      setLoadingRoadmap(true);
      const language = user?.preferredLanguage || 'python';
      const goal = user?.learningGoal || 'DSA Basics';
      
      const response = await axios.post("/api/ai/roadmap", {
        language,
        goal,
        level: 'Beginner'
      });

      if (response.data.success) {
        setRoadmap(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load roadmap:', error);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const openLesson = async (topic) => {
    setSelectedLesson(topic);
    setLoadingLesson(true);

    try {
      const language = user?.preferredLanguage || 'python';
      const response = await axios.post("/api/ai/lesson", {
        topic: topic.title,
        language
      });

      if (response.data.success) {
        setLessonContent(response.data.data);
      } else {
        toast.error('Lesson content not available');
      }
    } catch (error) {
      console.error('Failed to load lesson:', error);
      toast.error('Failed to load lesson');
    } finally {
      setLoadingLesson(false);
    }
  };

  const startPractice = async (topic) => {
    // Load test cases first
    try {
      const language = user?.preferredLanguage || 'python';
      const testCasesResponse = await axios.get(`/api/ai/testcases/${encodeURIComponent(topic.title)}/${language}`);
      
      if (testCasesResponse.data.success) {
        const testCasesData = testCasesResponse.data.data;
        
        const projectName = `Practice: ${topic.title}`;
        
        // Check if a project with this name already exists
        const existingProject = projects.find(p => p.name === projectName);
        
        if (existingProject) {
          // Open the existing project
          navigate(`/ide/${existingProject._id}`, {
            state: {
              topic: topic,
              testCases: testCasesData
            }
          });
          toast.success(`Opened existing practice for ${topic.title}`);
        } else {
          // Create a new practice project with starter code
          const starterCode = testCasesData.starterCode || `// Practice: ${topic.title}\n\n`;
          
          const project = await createProject(projectName, starterCode, language);
          if (project) {
            // Pass topic and test cases data to IDE via state
            navigate(`/ide/${project._id}`, {
              state: {
                topic: topic,
                testCases: testCasesData
              }
            });
            toast.success(`Started practice for ${topic.title}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load test cases:', error);
      toast.error('Failed to start practice');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const project = await createProject(newProjectName, "", newProjectLang);
    if (project) {
      setShowCreateModal(false);
      setNewProjectName("");
      navigate(`/ide/${project._id}`);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this project? This cannot be undone.")) {
      await deleteProject(projectId);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Code2 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">CodeNest</h1>
            </div>

            <nav className="flex items-center space-x-6">
              <button
                onClick={() => navigate("/analytics")}
                className="flex items-center space-x-2 hover:text-primary transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center space-x-2 hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-error hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* User Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Welcome back, {user?.username}! 👋
                </h2>
                <p className="text-dark-muted">{user?.bio}</p>
              </div>
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Flame className="w-5 h-5 text-warning mr-2" />
                    <p className="text-3xl font-bold">{user?.streak}</p>
                  </div>
                  <p className="text-sm text-dark-muted">Day Streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="w-5 h-5 text-primary mr-2" />
                    <p className="text-3xl font-bold">{user?.level}</p>
                  </div>
                  <p className="text-sm text-dark-muted">Level</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{user?.xp}</p>
                  <p className="text-sm text-dark-muted">XP</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Learning Roadmap Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold flex items-center">
              <Target className="w-6 h-6 mr-2 text-primary" />
              Your Learning Path
            </h3>
            <button
              onClick={() => navigate("/profile")}
              className="btn-secondary text-sm"
            >
              Change Goal
            </button>
          </div>

          {loadingRoadmap ? (
            <div className="card text-center py-8">
              <div className="spinner border-4 border-primary border-t-transparent rounded-full w-12 h-12 mx-auto mb-4"></div>
              <p className="text-dark-muted">Loading your roadmap...</p>
            </div>
          ) : roadmap?.topics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roadmap.topics.map((topic, index) => {
                const isCompleted = completedTopics.includes(topic.order);
                const isLocked = index > 0 && !completedTopics.includes(roadmap.topics[index - 1].order);

                return (
                  <motion.div
                    key={topic.order}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`card relative ${isLocked ? 'opacity-50' : 'hover:border-primary'} transition-all cursor-pointer`}
                    onClick={() => !isLocked && openLesson(topic)}
                  >
                    {isLocked && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-5 h-5 text-dark-muted" />
                      </div>
                    )}
                    {isCompleted && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                    )}

                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                        {topic.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                          {topic.title}
                        </h4>
                        <p className="text-xs text-dark-muted line-clamp-2">
                          {topic.description.substring(0, 60)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          !isLocked && openLesson(topic);
                        }}
                        disabled={isLocked}
                        className="btn-secondary text-xs py-1 flex-1 flex items-center justify-center space-x-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Lesson</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          !isLocked && startPractice(topic);
                        }}
                        disabled={isLocked}
                        className="btn-primary text-xs py-1 flex-1 flex items-center justify-center space-x-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Practice</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-8">
              <Target className="w-16 h-16 text-dark-muted mx-auto mb-4" />
              <p className="text-dark-muted mb-4">
                Set up your learning path in Profile
              </p>
              <button
                onClick={() => navigate("/profile")}
                className="btn-primary"
              >
                Setup Learning Path
              </button>
            </div>
          )}
        </motion.div>

        {/* Projects Section */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Your Projects</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/ide/${project._id}`)}
              className="card cursor-pointer hover:border-primary transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Folder className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {project.name}
                    </h4>
                    <p className="text-sm text-dark-muted">
                      {project.files.length} file
                      {project.files.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteProject(project._id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-error hover:text-red-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-dark-muted">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Code2 className="w-16 h-16 text-dark-muted mx-auto mb-4" />
              <p className="text-dark-muted mb-4">
                No projects yet. Create your first project!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card w-full max-w-md m-4"
          >
            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input-field w-full"
                  placeholder="My Awesome Project"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Starting Language
                </label>
                <select
                  value={newProjectLang}
                  onChange={(e) => setNewProjectLang(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lesson Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card w-full max-w-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {selectedLesson.order}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedLesson.title}</h3>
                  <p className="text-sm text-dark-muted">
                    {user?.preferredLanguage || 'Python'} Lesson
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLesson(null)}
                className="text-dark-muted hover:text-dark-text"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingLesson ? (
              <div className="text-center py-12">
                <div className="spinner border-4 border-primary border-t-transparent rounded-full w-12 h-12 mx-auto mb-4"></div>
                <p className="text-dark-muted">Loading lesson content...</p>
              </div>
            ) : lessonContent ? (
              <div className="space-y-6">
                {/* Topic Description */}
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <p className="text-dark-muted leading-relaxed">
                    {selectedLesson.description}
                  </p>
                </div>

                {/* Explanation */}
                <div>
                  <h4 className="font-bold text-lg mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-primary" />
                    Concept Explanation
                  </h4>
                  <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {lessonContent.explanation}
                    </p>
                  </div>
                </div>

                {/* Example */}
                {lessonContent.example && (
                  <div>
                    <h4 className="font-bold text-lg mb-3 flex items-center">
                      <Code2 className="w-5 h-5 mr-2 text-success" />
                      Code Example
                    </h4>
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                      <pre className="text-sm font-mono overflow-x-auto mb-3">
                        <code>{lessonContent.example.code}</code>
                      </pre>
                      <p className="text-sm text-dark-muted">
                        <strong>Explanation:</strong> {lessonContent.example.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Common Mistake */}
                {lessonContent.commonMistake && (
                  <div>
                    <h4 className="font-bold text-lg mb-3 flex items-center text-warning">
                      ⚠️ Common Mistake
                    </h4>
                    <div className="bg-warning/10 border border-warning rounded-lg p-4">
                      <p className="text-sm mb-2">
                        <strong>Mistake:</strong> {lessonContent.commonMistake.mistake}
                      </p>
                      <p className="text-sm text-dark-muted">
                        <strong>Why:</strong> {lessonContent.commonMistake.why}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => startPractice(selectedLesson)}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Practice</span>
                  </button>
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-error">Failed to load lesson content</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* AI Assistant - Floating Chat */}
      <AIAssistant />
    </div>
  );
};

export default Dashboard;
