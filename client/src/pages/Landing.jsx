import { useNavigate } from "react-router-dom";
import { 
  Code, 
  Zap, 
  Brain, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  CheckCircle,
  BarChart3,
  Target,
  Lightbulb,
  Rocket,
  Star
} from "lucide-react";
import LandingAIAssistant from "../components/LandingAIAssistant";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Interactive Code Editor",
      description: "Write, run, and debug code with our powerful Monaco-based editor supporting multiple languages."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Hint System",
      description: "Get strategic hints, not solutions. Learn by solving problems yourself with time & space complexity analysis."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Unified Learning Roadmaps",
      description: "All resources in one place. Master fundamentals with language-specific roadmaps—no scattered tutorials."
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Gamified Experience",
      description: "Earn XP, level up, and track your progress as you master new skills."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Visualize your learning journey with detailed statistics and insights."
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Smart Test Cases",
      description: "Validate your solutions against comprehensive test cases with instant feedback."
    }
  ];

  const stats = [
    { value: "10+", label: "Programming Topics" },
    { value: "100+", label: "Practice Problems" },
    { value: "AI", label: "Powered Assistance" },
    { value: "24/7", label: "Learning Access" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg via-dark-surface to-dark-bg">
      {/* Navigation */}
      <nav className="bg-dark-surface/80 backdrop-blur-lg border-b border-dark-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              CodeNest
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 text-sm font-medium text-white hover:text-primary transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative">
        {/* Background Decorative SVGs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute top-20 left-10 w-32 h-32 text-primary/10 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="40" />
          </svg>
          <svg className="absolute top-40 right-20 w-24 h-24 text-purple-500/10 animate-pulse" style={{ animationDelay: '1s' }} viewBox="0 0 100 100" fill="currentColor">
            <polygon points="50,10 90,90 10,90" />
          </svg>
          <svg className="absolute bottom-20 left-1/4 w-20 h-20 text-pink-500/10 animate-pulse" style={{ animationDelay: '2s' }} viewBox="0 0 100 100" fill="currentColor">
            <rect x="25" y="25" width="50" height="50" />
          </svg>
        </div>

        <div className="text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Master Coding with
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Intelligent Guidance
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Don't skip the fundamentals! Master programming from the ground up with our unified platform. 
            AI-guided hints help you learn by solving, not copy-pasting—designed specifically for beginners.
          </p>
          
          {/* Hero Illustration */}
          <div className="mb-12 relative">
            <svg className="w-full max-w-4xl mx-auto h-64" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Code Editor Window */}
              <g>
                <rect x="100" y="50" width="300" height="200" rx="8" fill="url(#gradient1)" />
                <rect x="100" y="50" width="300" height="30" rx="8" fill="#1f2937" />
                <circle cx="115" cy="65" r="5" fill="#ef4444" />
                <circle cx="135" cy="65" r="5" fill="#f59e0b" />
                <circle cx="155" cy="65" r="5" fill="#10b981" />
                
                {/* Code Lines */}
                <line x1="120" y1="100" x2="200" y2="100" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                <line x1="140" y1="120" x2="240" y2="120" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
                <line x1="140" y1="140" x2="220" y2="140" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
                <line x1="120" y1="160" x2="260" y2="160" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                <line x1="140" y1="180" x2="200" y2="180" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
              </g>
              
              {/* AI Brain */}
              <g>
                <circle cx="550" cy="150" r="60" fill="url(#gradient2)" opacity="0.3" />
                <circle cx="550" cy="150" r="45" fill="url(#gradient3)" />
                
                {/* Neural Network Nodes */}
                <circle cx="530" cy="130" r="6" fill="#ffffff" />
                <circle cx="550" cy="120" r="6" fill="#ffffff" />
                <circle cx="570" cy="130" r="6" fill="#ffffff" />
                <circle cx="540" cy="150" r="6" fill="#ffffff" />
                <circle cx="560" cy="150" r="6" fill="#ffffff" />
                <circle cx="530" cy="170" r="6" fill="#ffffff" />
                <circle cx="550" cy="180" r="6" fill="#ffffff" />
                <circle cx="570" cy="170" r="6" fill="#ffffff" />
                
                {/* Neural Connections */}
                <line x1="530" y1="130" x2="540" y2="150" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
                <line x1="550" y1="120" x2="540" y2="150" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
                <line x1="570" y1="130" x2="560" y2="150" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
                <line x1="540" y1="150" x2="530" y2="170" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
                <line x1="560" y1="150" x2="550" y2="180" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
                <line x1="560" y1="150" x2="570" y2="170" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
              </g>
              
              {/* Connecting Lines with Animation */}
              <g opacity="0.6">
                <line x1="400" y1="150" x2="490" y2="150" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1s" repeatCount="indefinite" />
                </line>
                <polygon points="490,145 500,150 490,155" fill="#6366f1" />
              </g>
              
              {/* Floating Code Symbols */}
              <text x="250" y="40" fontSize="24" fill="#6366f1" opacity="0.5">&lt;/&gt;</text>
              <text x="650" y="80" fontSize="20" fill="#8b5cf6" opacity="0.5">{ }</text>
              <text x="680" y="220" fontSize="18" fill="#ec4899" opacity="0.5">( )</text>
              
              {/* Gradients */}
              <defs>
                <linearGradient id="gradient1" x1="100" y1="50" x2="400" y2="250">
                  <stop offset="0%" stopColor="#1f2937" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
                <linearGradient id="gradient2" x1="490" y1="90" x2="610" y2="210">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="gradient3" x1="505" y1="105" x2="595" y2="195">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => navigate("/register")}
              className="group px-8 py-4 bg-gradient-to-r from-primary to-purple-500 hover:from-primary-hover hover:to-purple-600 text-white rounded-lg font-semibold text-lg transition-all shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-105 flex items-center space-x-2"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-dark-surface hover:bg-dark-hover border border-dark-border text-white rounded-lg font-semibold text-lg transition-all"
            >
              Sign In
            </button>
          </div>

          <div className="flex items-center justify-center space-x-8 mt-12 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Beginner Friendly</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Master Fundamentals</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Unified Platform</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-dark-surface to-dark-bg border border-dark-border rounded-xl p-6 text-center hover:border-primary/50 transition-all hover:scale-105"
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1" fill="currentColor" className="text-primary" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Build Strong Fundamentals First
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Stop jumping to AI for answers. Master the basics with a unified platform designed exclusively for beginners.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-gradient-to-br from-dark-surface to-dark-bg border border-dark-border rounded-xl p-6 hover:border-primary/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/20 relative overflow-hidden"
            >
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id={`featureGlow${idx}`}>
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="50" fill={`url(#featureGlow${idx})`} />
                </svg>
              </div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative">
        {/* Decorative SVG Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute -top-10 -left-10 w-64 h-64 text-primary/5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,40.3,76.3C26.8,83.6,10.8,85.6,-4.6,83.9C-20,82.2,-34.7,76.8,-47.8,69.1C-60.9,61.4,-72.4,51.4,-79.8,38.5C-87.2,25.6,-90.5,9.8,-88.7,-5.1C-86.9,-20,-80,-34,-70.8,-46.4C-61.6,-58.8,-50.1,-69.6,-36.8,-77.2C-23.5,-84.8,-8.4,-89.2,5.3,-87.9C19,-86.6,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
          <svg className="absolute -bottom-10 -right-10 w-64 h-64 text-purple-500/5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M39.9,-66.3C51.5,-59.4,60.3,-48.3,67.5,-36.1C74.7,-23.9,80.3,-10.6,81.1,3.3C81.9,17.2,77.9,31.7,70.1,43.9C62.3,56.1,50.7,66,37.8,72.4C24.9,78.8,10.7,81.7,-3.4,80.3C-17.5,78.9,-31.6,73.2,-43.8,66.3C-56,59.4,-66.3,51.3,-73.4,40.5C-80.5,29.7,-84.4,16.2,-84.1,2.9C-83.8,-10.4,-79.3,-23.5,-71.8,-34.9C-64.3,-46.3,-53.8,-56,-41.5,-63.2C-29.2,-70.4,-15,-75.1,-0.8,-73.5C13.4,-71.9,28.3,-73.2,39.9,-66.3Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Your Learning Journey
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A simple, structured path from beginner to expert.
          </p>
          
          {/* Journey Illustration */}
          <div className="mt-12">
            <svg className="w-full max-w-3xl mx-auto h-32" viewBox="0 0 600 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              
              {/* Path */}
              <path d="M 50 50 Q 200 20, 300 50 T 550 50" stroke="url(#pathGradient)" strokeWidth="4" fill="none" strokeDasharray="8,8">
                <animate attributeName="stroke-dashoffset" from="0" to="16" dur="2s" repeatCount="indefinite" />
              </path>
              
              {/* Milestone Circles */}
              <circle cx="50" cy="50" r="15" fill="#6366f1" />
              <circle cx="300" cy="50" r="15" fill="#8b5cf6" />
              <circle cx="550" cy="50" r="15" fill="#10b981" />
              
              {/* Icons in circles */}
              <text x="50" y="58" fontSize="18" fill="white" textAnchor="middle">1</text>
              <text x="300" y="58" fontSize="18" fill="white" textAnchor="middle">2</text>
              <text x="550" y="58" fontSize="18" fill="white" textAnchor="middle">3</text>
            </svg>
          </div>
        </div>

        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Your Learning Journey
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A simple, structured path from beginner to expert.
          </p>
          
          {/* Journey Illustration */}
          <div className="mt-12">
            <svg className="w-full max-w-3xl mx-auto h-32" viewBox="0 0 600 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              
              {/* Path */}
              <path d="M 50 50 Q 200 20, 300 50 T 550 50" stroke="url(#pathGradient)" strokeWidth="4" fill="none" strokeDasharray="8,8">
                <animate attributeName="stroke-dashoffset" from="0" to="16" dur="2s" repeatCount="indefinite" />
              </path>
              
              {/* Milestone Circles */}
              <circle cx="50" cy="50" r="15" fill="#6366f1" />
              <circle cx="300" cy="50" r="15" fill="#8b5cf6" />
              <circle cx="550" cy="50" r="15" fill="#10b981" />
              
              {/* Icons in circles */}
              <text x="50" y="58" fontSize="18" fill="white" textAnchor="middle">1</text>
              <text x="300" y="58" fontSize="18" fill="white" textAnchor="middle">2</text>
              <text x="550" y="58" fontSize="18" fill="white" textAnchor="middle">3</text>
            </svg>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border-2 border-primary rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Choose Your Path</h3>
              <p className="text-gray-400">
                Select from curated topics and structured learning paths tailored to your goals.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <ArrowRight className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Code & Practice</h3>
              <p className="text-gray-400">
                Write code in our powerful editor and solve real-world problems with instant feedback.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <ArrowRight className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500/20 to-success/20 border-2 border-success rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-success rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Level Up & Master</h3>
            <p className="text-gray-400">
              Track progress, earn XP, and unlock advanced topics as you grow your skills.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/30 rounded-2xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-purple-500/5 animate-pulse"></div>
          
          {/* Decorative Elements */}
          <svg className="absolute top-5 right-5 w-16 h-16 text-primary/20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray="5,5">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="10s" repeatCount="indefinite" />
            </circle>
          </svg>
          <svg className="absolute bottom-5 left-5 w-12 h-12 text-purple-500/20" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="50,10 90,90 10,90">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite" />
            </polygon>
          </svg>
          
          {/* Sparkle Effects */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-pink-500 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10">
            <Rocket className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready to Start Your Journey?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of learners mastering coding with AI-powered guidance. 
              Start your free account today and unlock your potential.
            </p>
            <button
              onClick={() => navigate("/register")}
              className="group px-10 py-5 bg-gradient-to-r from-primary to-purple-500 hover:from-primary-hover hover:to-purple-600 text-white rounded-xl font-bold text-xl transition-all shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-105 flex items-center space-x-3 mx-auto"
            >
              <Star className="w-6 h-6" />
              <span>Get Started Free</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-surface/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                CodeNest
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2026 CodeNest. Empowering developers with AI.
            </div>
          </div>
        </div>
      </footer>

      {/* AI Assistant - No Login Required */}
      <LandingAIAssistant />
    </div>
  );
};

export default Landing;
