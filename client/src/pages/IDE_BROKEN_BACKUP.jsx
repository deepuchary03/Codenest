import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import Editor from "@monaco-editor/react";
import axios from "axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import {
  Play,
  Save,
  FileCode,
  Plus,
  X,
  ArrowLeft,
  Sparkles,
  BarChart3,
  Brain,
  CheckCircle,
  Send,
  GripVertical,
  Minimize2,
  Maximize2,
  Info,
} from "lucide-react";
import { InlineMath } from "react-katex";

const IDE = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const {
    currentProject,
    activeFile,
    loadProject,
    saveProject,
    updateFileContent,
    addFile,
    deleteFile,
    setActiveFile,
    saveStatus,
  } = useWorkspace();

  const [output, setOutput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [testCases, setTestCases] = useState(null);
  const [topic, setTopic] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [executionMetrics, setExecutionMetrics] = useState(null);
  const [consoleInput, setConsoleInput] = useState("");
  const editorRef = useRef(null);
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef(null);
  
  // Fixed layout - no resizing
  const CONSOLE_HEIGHT = 220;
  const PROBLEM_HEIGHT = 180;
  
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('files');

  useEffect(() => {
    loadProject(projectId);
    
    // Load test cases if passed from Dashboard
    if (location.state?.testCases) {
      setTestCases(location.state.testCases);
      setTopic(location.state.topic);
    }
  }, [projectId]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'j') {
          e.preventDefault();
          setConsoleOpen(prev => !prev);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEditorChange = (value) => {
    if (activeFile) {
      updateFileContent(activeFile.name, value);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const runCode = async () => {
    if (!activeFile) {
      toast.error('No file selected');
      return;
    }

    if (!activeFile.content || activeFile.content.trim() === '') {
      toast.error('Cannot run empty code');
      return;
    }

    setExecuting(true);
    setOutput("⏳ Running code...\n");
    setExecutionMetrics(null);

    try {
      const response = await axios.post("/api/execute", {
        code: activeFile.content,
        language: activeFile.language,
        input: consoleInput,
      });

      // Always show output regardless of success
      setOutput(response.data.output || "Code executed with no output.");
      
      // Set execution metrics if available
      if (response.data.executionTime !== undefined) {
        setExecutionMetrics({
          time: response.data.executionTime,
          memory: response.data.memoryUsage || 0,
        });
      }

      // Show success toast only if no errors
      if (response.data.success) {
        toast.success('Code executed successfully!');
        
        // Update user if leveled up
        if (response.data.leveledUp) {
          toast.success(
            `🎉 Level Up! You're now Level ${response.data.newLevel}!`
          );
          const updatedUser = {
            ...user,
            level: response.data.newLevel,
            xp: user.xp + response.data.xpGained,
          };
          updateUser(updatedUser);
        }
      } else {
        toast.error('Code execution failed - check console output');
      }

      // Save execution to project history (only if successful)
      if (response.data.success) {
        try {
          await axios.post(`/api/projects/${projectId}/execution`, {
            fileName: activeFile.name,
            language: activeFile.language,
            executionTime: response.data.executionTime,
            memoryUsage: response.data.memoryUsage,
            complexity: complexity?.timeComplexity || "Not analyzed",
          });
        } catch (historyError) {
          console.error('Failed to save execution history:', historyError);
        }
      }
    } catch (error) {
      console.error('Code execution error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          error.message || 
                          'Unknown error occurred';
      setOutput(`❌ Execution Failed:\n\n${errorMessage}`);
      toast.error('Failed to execute code');
    } finally {
      setExecuting(false);
    }
  };

  const submitTestCases = async () => {
    if (!testCases || !activeFile) {
      toast.error('No test cases available');
      return;
    }

    setSubmitting(true);
    setOutput("⏳ Running all test cases...\n\n");
    const results = [];

    try {
      // Run code against each test case
      for (let i = 0; i < testCases.testCases.length; i++) {
        const testCase = testCases.testCases[i];
        
        try {
          const response = await axios.post("/api/execute", {
            code: activeFile.content,
            language: activeFile.language,
            input: testCase.input,
          });

          const actualOutput = response.data.output?.trim();
          const expectedOutput = testCase.expectedOutput.trim();
          const passed = actualOutput === expectedOutput;

          results.push({
            testCase: i + 1,
            passed,
            input: testCase.input,
            expected: expectedOutput,
            actual: actualOutput,
            description: testCase.description
          });

        } catch (error) {
          results.push({
            testCase: i + 1,
            passed: false,
            input: testCase.input,
            expected: testCase.expectedOutput,
            actual: error.response?.data?.error || 'Execution failed',
            description: testCase.description
          });
        }
      }

      setTestResults(results);
      
      // Check if all passed
      const allPassed = results.every(r => r.passed);
      
      if (allPassed) {
        // Mark topic as completed
        try {
          const response = await axios.post("/api/progress/complete", {
            topicOrder: topic.order,
            topicTitle: topic.title
          });

          if (response.data.success) {
            toast.success(`🎉 ${topic.title} completed! +${response.data.xpGained} XP`);
            updateUser({ ...user, xp: response.data.newXP, level: response.data.newLevel });
            
            setOutput(`✅ All test cases passed!\n\nTopic "${topic.title}" completed!\n+${response.data.xpGained} XP earned!\n\nNext topic unlocked!`);
          }
        } catch (error) {
          console.error('Failed to mark complete:', error);
          setOutput(`✅ All test cases passed!\n\nGreat job!`);
        }
      } else {
        const passedCount = results.filter(r => r.passed).length;
        setOutput(`Test Results: ${passedCount}/${results.length} passed\n\nSome test cases failed. Review the results below and try again!`);
        toast.warning(`${passedCount}/${results.length} test cases passed`);
      }

    } catch (error) {
      console.error('Test execution error:', error);
      toast.error('Failed to run test cases');
    } finally {
      setSubmitting(false);
    }
  };

  const explainError = async () => {
    if (!activeFile || !output.includes("Error")) {
      toast.error("No error to explain");
      return;
    }

    setShowAIPanel(true);
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: '🐛 Please explain this error',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Add loading message
    const loadingMessage = {
      role: 'assistant',
      content: '🤔 Analyzing your error...',
      timestamp: new Date(),
      loading: true
    };
    setChatMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await axios.post("/api/ai/explain-error", {
        code: activeFile.content,
        error: output,
        language: activeFile.language,
        topic: currentProject?.name || 'General',
      });

      if (response.data.success && response.data.data) {
        const explanation = response.data.data;
        const aiMessage = {
          role: 'assistant',
          content: 
            `**What went wrong:**\n${explanation.mistake}\n\n` +
            `**Concept to review:** ${explanation.concept}\n\n` +
            `**Hint:** ${explanation.hint}\n\n` +
            `**Example:**\n${explanation.example}`,
          timestamp: new Date()
        };
        
        // Remove loading message and add actual response
        setChatMessages(prev => [...prev.filter(m => !m.loading), aiMessage]);
      } else {
        const aiMessage = {
          role: 'assistant',
          content: response.data.explanation || "Failed to generate explanation.",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev.filter(m => !m.loading), aiMessage]);
      }
    } catch (error) {
      console.error('Error explanation failed:', error);
      
      // Provide static fallback explanation based on common errors
      let fallbackExplanation = "I encountered an issue analyzing this error. Here are some general debugging tips:\n\n";
      
      if (output.includes('SyntaxError')) {
        fallbackExplanation += 
          `**Common Syntax Issues:**\n` +
          `• Missing colons (:) after if/for/while/def statements\n` +
          `• Incorrect indentation (use 4 spaces consistently)\n` +
          `• Mismatched parentheses, brackets, or quotes\n` +
          `• Invalid variable names\n\n` +
          `**Tip:** Check the line number in the error message carefully!`;
      } else if (output.includes('NameError')) {
        fallbackExplanation += 
          `**NameError means:**\n` +
          `• Variable is used before being defined\n` +
          `• Typo in variable/function name\n` +
          `• Variable is out of scope\n\n` +
          `**Tip:** Make sure to define variables before using them!`;
      } else if (output.includes('TypeError')) {
        fallbackExplanation += 
          `**TypeError means:**\n` +
          `• Wrong data type used in operation\n` +
          `• Incorrect number of function arguments\n` +
          `• Cannot perform operation on this data type\n\n` +
          `**Tip:** Check data types with print(type(variable))!`;
      } else if (output.includes('IndexError')) {
        fallbackExplanation += 
          `**IndexError means:**\n` +
          `• Trying to access index that doesn't exist\n` +
          `• List/array is shorter than expected\n\n` +
          `**Tip:** Check list length with len() before accessing!`;
      } else {
        fallbackExplanation += 
          `**General Debugging Steps:**\n` +
          `1. Read the error message carefully\n` +
          `2. Check the line number mentioned\n` +
          `3. Add print statements to track values\n` +
          `4. Test with simple inputs first\n` +
          `5. Review the problem requirements\n\n` +
          `**Topic:** ${currentProject?.name || 'General Programming'}`;
      }
      
      const errorMessage = {
        role: 'assistant',
        content: fallbackExplanation,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev.filter(m => !m.loading), errorMessage]);
    }
  };

  const analyzeComplexity = async () => {
    if (!activeFile?.content) {
      toast.error("No code to analyze");
      return;
    }

    setShowAIPanel(true);
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: '📊 Analyze complexity of my code',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Add loading message
    const loadingMessage = {
      role: 'assistant',
      content: '🤔 Analyzing code complexity...',
      timestamp: new Date(),
      loading: true
    };
    setChatMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await axios.post("/api/ai/analyze-complexity", {
        code: activeFile.content,
        language: activeFile.language,
      });

      const complexityData = response.data;
      const aiMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        complexity: complexityData
      };
      
      // Remove loading message and add actual response
      setChatMessages(prev => [...prev.filter(m => !m.loading), aiMessage]);
    } catch (error) {
      console.error('Complexity analysis failed:', error);
      
      // Provide static fallback complexity tips
      const fallbackMessage = {
        role: 'assistant',
        content: 
          `I encountered an issue analyzing complexity. Here are general optimization guidelines:\n\n` +
          `**Time Complexity Tips:**\n` +
          `• Single loop: O(n)\n` +
          `• Nested loops: O(n²) - try to optimize\n` +
          `• Binary search: O(log n)\n` +
          `• Sorting: O(n log n)\n\n` +
          `**Space Complexity Tips:**\n` +
          `• Few variables: O(1) - Optimal!\n` +
          `• List/array of size n: O(n)\n` +
          `• Matrix n×n: O(n²)\n\n` +
          `**Quick Optimization Check:**\n` +
          `✓ Can you avoid nested loops?\n` +
          `✓ Can you use a dictionary for faster lookups?\n` +
          `✓ Can you process data in a single pass?\n\n` +
          `Keep coding! 💪`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev.filter(m => !m.loading), fallbackMessage]);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const query = chatInput.trim();
    setChatInput('');
    
    // Add loading message
    const loadingMessage = {
      role: 'assistant',
      content: 'Thinking...',
      loading: true,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, loadingMessage]);
    
    try {
      // Call the AI chat endpoint
      const response = await axios.post(
        '/api/ai/chat',
        {
          userMessage: query,
          code: activeFile?.content || '',
          language: activeFile?.language || currentProject?.language || 'python',
          topic: topic?.title || currentProject?.name || 'General Programming',
          chatHistory: chatMessages.filter(m => !m.loading).slice(-6)
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const aiMessage = {
        role: 'assistant',
        content: response.data.data?.response || response.data.reply || response.data.message || 'No response received',
        timestamp: new Date()
      };
      
      // Remove loading message and add actual response
      setChatMessages(prev => [...prev.filter(m => !m.loading), aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback to basic response if API fails
      let aiResponse = '';
      const queryLower = query.toLowerCase();
      
      if (queryLower.includes('help') || queryLower.includes('stuck') || queryLower.includes('hint')) {
        aiResponse = `💡 **Here are some tips:**\n\n` +
          `1. Break down the problem into smaller steps\n` +
          `2. Test your code with simple inputs first\n` +
          `3. Use print statements to debug\n` +
          `4. Review the problem description carefully\n\n` +
          `Click "Analyze" to check your code complexity or run your code to see errors!`;
      } else if (queryLower.includes('syntax') || queryLower.includes('error')) {
        aiResponse = `🔍 **Common Syntax Tips:**\n\n` +
          `• Check for missing syntax elements\n` +
          `• Verify proper indentation\n` +
          `• Make sure parentheses and brackets are balanced\n` +
          `• Check for typos in variable names\n\n` +
          `Run your code to see specific errors, then click "Explain Error" for detailed help!`;
      } else {
        aiResponse = `🤖 **AI Assistant:**\n\n` +
          `I'm having trouble connecting to the AI service. Here are some quick tips:\n\n` +
          `• **Analyze** - Click to check time/space complexity\n` +
          `• **Error Explanation** - Run your code, if it errors, click "Explain Error"\n` +
          `• **General Tips** - Ask about syntax, optimization, testing\n\n` +
          `**Current Topic:** ${currentProject?.name || topic?.name || 'General Programming'}\n\n` +
          `Keep practicing! 💪`;
      }
      
      const fallbackMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev.filter(m => !m.loading), fallbackMessage]);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAddFile = () => {
    const name = prompt("File name:");
    if (!name) return;

    const ext = name.split(".").pop();
    const langMap = {
      py: "python",
      java: "java",
      js: "javascript",
      cpp: "cpp",
      c: "c",
    };

    const file = addFile(name, langMap[ext] || "python");
    if (file) {
      setActiveFile(file);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{currentProject?.name}</h1>
          <span
            className={`text-xs ${
              saveStatus === "saved"
                ? "text-success"
                : saveStatus === "saving"
                ? "text-warning"
                : "text-dark-muted"
            }`}
          >
            {saveStatus === "saved"
              ? "✓ Saved"
              : saveStatus === "saving"
              ? "Saving..."
              : "Unsaved changes"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={saveProject}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          <button
            onClick={runCode}
            disabled={executing}
            className="btn-primary flex items-center space-x-2 text-sm"
          >
            <Play className="w-4 h-4" />
            <span>{executing ? "Running..." : "Run"}</span>
          </button>
          <button
            onClick={analyzeComplexity}
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analyze</span>
          </button>
          {testCases && (
            <button
              onClick={submitTestCases}
              disabled={submitting}
              className="btn-success flex items-center space-x-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? "Submitting..." : "Submit"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Explorer & Test Cases - Fixed 28.57% (2/7) */}
        <div 
          style={{ width: '28.57%' }} 
          className="bg-dark-surface border-r border-dark-border flex flex-col"
        >
          {/* Tabs */}
          <div className="flex border-b border-dark-border">
            <button
              onClick={() => setSidebarTab('files')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                sidebarTab === 'files'
                  ? 'bg-dark-hover text-primary border-b-2 border-primary'
                  : 'text-dark-muted hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FileCode className="w-4 h-4" />
                <span>FILES</span>
              </div>
            </button>
            {testCases && (
              <button
                onClick={() => setSidebarTab('tests')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                  sidebarTab === 'tests'
                    ? 'bg-dark-hover text-primary border-b-2 border-primary'
                    : 'text-dark-muted hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>TESTS</span>
                </div>
              </button>
            )}
          </div>

          {/* Files Tab Content */}
          {sidebarTab === 'files' && (
            <>
              <div className="p-3 border-b border-dark-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Project Files</h3>
                <button
                  onClick={handleAddFile}
                  className="hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {currentProject?.files.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => setActiveFile(file)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between group hover:bg-dark-hover transition-colors ${
                      activeFile?.name === file.name
                        ? "bg-dark-hover text-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4" />
                      <span>{file.name}</span>
                    </div>
                    {currentProject.files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-error"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Test Cases Tab Content */}
          {sidebarTab === 'tests' && testCases && (
            <>
              <div className="p-3 border-b border-dark-border">
                <h3 className="font-semibold text-sm">Test Cases</h3>
                <p className="text-xs text-dark-muted mt-1">
                  {testCases.testCases?.length || 0} test cases to pass
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {testCases.testCases?.map((testCase, idx) => {
                  const result = testResults.find(r => r.testCase === idx + 1);
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        result
                          ? result.passed
                            ? 'bg-success/10 border-success'
                            : 'bg-error/10 border-error'
                          : 'bg-dark-bg border-dark-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          result
                            ? result.passed
                              ? 'bg-success text-white'
                              : 'bg-error text-white'
                            : 'bg-dark-border text-dark-muted'
                        }`}>
                          Test #{idx + 1}
                        </span>
                        {result && (
                          <span className={`text-xs font-bold ${
                            result.passed ? 'text-success' : 'text-error'
                          }`}>
                            {result.passed ? '✓ PASSED' : '✗ FAILED'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dark-muted mb-2">
                        {testCase.description}
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="bg-dark-bg/50 p-2 rounded">
                          <span className="text-dark-muted font-semibold">Input:</span>
                          <pre className="font-mono text-white mt-1 whitespace-pre-wrap break-words">
                            {testCase.input}
                          </pre>
                        </div>
                        <div className="bg-dark-bg/50 p-2 rounded">
                          <span className="text-dark-muted font-semibold">Expected Output:</span>
                          <pre className="font-mono text-white mt-1 whitespace-pre-wrap break-words">
                            {testCase.expectedOutput}
                          </pre>
                        </div>
                        {result && result.actual && (
                          <div className={`p-2 rounded ${
                            !result.passed ? 'bg-error/20' : 'bg-dark-bg/50'
                          }`}>
                            <span className="text-dark-muted font-semibold">Your Output:</span>
                            <pre className={`font-mono mt-1 whitespace-pre-wrap break-words ${
                              !result.passed ? 'text-error font-bold' : 'text-white'
                            }`}>
                              {result.actual}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Main Editor Area - Fixed 42.86% (3/7) */}
        <div style={{ width: '42.86%' }} className="flex flex-col relative">
          {/* Problem Statement Panel - Fixed height */}
          {testCases && (
            <div 
              style={{ height: `${PROBLEM_HEIGHT}px` }} 
              className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-b-2 border-primary flex flex-col overflow-hidden"
            >
              <div className="p-4 flex items-start justify-between shrink-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold">
                      {topic?.title || "Practice Problem"}
                    </div>
                    <div className="px-2 py-1 bg-warning/20 text-warning rounded text-xs">
                      {topic?.difficulty || "Medium"}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-white">Problem Statement</h2>
                  <div className="text-sm text-gray-200 leading-relaxed overflow-y-auto" style={{ maxHeight: `${PROBLEM_HEIGHT - 80}px` }}>
                    {testCases.problemStatement}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-dark-muted">
                <p>No file selected</p>
              </div>
            )}
          </div>

          {/* Console (Fixed Height Toggle) */}
          {consoleOpen && (
            <div 
              style={{ height: `${CONSOLE_HEIGHT}px` }} 
              className="bg-dark-surface border-t border-dark-border flex flex-col relative overflow-hidden transition-all duration-200 ease-in-out"
            >
              <div className="px-4 py-2 border-b border-dark-border flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-sm">CONSOLE</h3>
              {executionMetrics && (
                <div className="flex items-center space-x-4 text-xs text-dark-muted">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded">⚡ {executionMetrics.time}ms</span>
                  <span className="px-2 py-1 bg-success/10 text-success rounded">💾 {executionMetrics.memory}MB</span>
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-b border-dark-border shrink-0">
              <input
                type="text"
                placeholder="Input (optional) - Enter values separated by spaces or newlines"
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                className="input-field w-full text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 font-mono text-sm min-h-0">
              <pre className="whitespace-pre-wrap break-words">
                {output || "Output will appear here..."}
              </pre>
              
              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-white">Test Case Results</h3>
                    <div className="text-sm text-dark-muted">
                      {testResults.filter(r => r.passed).length} / {testResults.length} Passed
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {testResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          result.passed
                            ? 'bg-success/10 border-success shadow-lg shadow-success/20'
                            : 'bg-error/10 border-error shadow-lg shadow-error/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              result.passed ? 'bg-success text-white' : 'bg-error text-white'
                            }`}>
                              Test #{result.testCase}
                            </span>
                            <span className="text-xs text-dark-muted">{result.description}</span>
                          </div>
                          <span className={`font-bold text-sm flex items-center space-x-1 ${
                            result.passed ? 'text-success' : 'text-error'
                          }`}>
                            {result.passed ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>PASSED</span>
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4" />
                                <span>FAILED</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="bg-dark-bg/50 p-2 rounded">
                            <span className="text-dark-muted">Input:</span>
                            <div className="font-mono text-white mt-1">{result.input}</div>
                          </div>
                          <div className="bg-dark-bg/50 p-2 rounded">
                            <span className="text-dark-muted">Expected:</span>
                            <div className="font-mono text-white mt-1">{result.expected}</div>
                          </div>
                          <div className={`p-2 rounded ${
                            !result.passed ? 'bg-error/20' : 'bg-dark-bg/50'
                          }`}>
                            <span className="text-dark-muted">Actual:</span>
                            <div className={`font-mono mt-1 ${
                              !result.passed ? 'text-error font-bold' : 'text-white'
                            }`}>
                              {result.actual}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {output.includes("Error") && (
              <div className="px-4 py-2 border-t border-dark-border shrink-0">
                <button
                  onClick={explainError}
                  className="btn-secondary text-sm flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Explain Error (AI Mentor)</span>
                </button>
              </div>
            )}
          </div>
          )}
          
          {/* Console Toggle Button (when closed) */}
          {!consoleOpen && (
            <div className="bg-dark-surface border-t border-dark-border px-4 py-2 flex items-center justify-between transition-all duration-200">
              <span className="text-sm text-dark-muted">Console hidden</span>
              <button
                onClick={() => setConsoleOpen(true)}
                className="text-xs text-primary hover:text-white transition-colors"
                title="Show Console (Ctrl+J)"
              >
                Show Console ↑
              </button>
            </div>
          )}
        </div>

        {/* AI Panel - Fixed 28.57% (2/7) - Always Visible */}
        <div 
          style={{ width: '28.57%' }} 
          className="bg-dark-surface border-l-2 border-primary flex flex-col"
        >
          <div className="p-4 border-b border-dark-border flex items-center bg-dark-bg">
            <Brain className="w-5 h-5 text-primary mr-2" />
            <h3 className="font-semibold text-lg">AI Assistant</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-dark-muted">
                  <Brain className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm">AI Assistant is ready to help!</p>
                  <p className="text-xs mt-2">Ask questions, explain errors, or analyze code complexity.</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-dark-bg border border-dark-border'
                        }`}
                      >
                        {message.loading && (
                          <div className="flex items-center space-x-2">
                            <div className="spinner border-2 border-primary border-t-transparent rounded-full w-4 h-4"></div>
                            <span className="text-sm">{message.content}</span>
                          </div>
                        )}
                        
                        {!message.loading && message.complexity && (
                          <div className="space-y-3">
                            <h4 className="font-semibold flex items-center text-primary mb-3">
                              <BarChart3 className="w-5 h-5 mr-2" />
                              Complexity Analysis
                            </h4>
                            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-lg p-3">
                              <p className="text-xs text-dark-muted mb-1 uppercase tracking-wide">
                                Time Complexity
                              </p>
                              <div className="text-2xl font-mono text-primary font-bold">
                                <InlineMath math={message.complexity.timeComplexity} />
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-success/10 to-emerald-500/10 border border-success/30 rounded-lg p-3">
                              <p className="text-xs text-dark-muted mb-1 uppercase tracking-wide">
                                Space Complexity
                              </p>
                              <div className="text-2xl font-mono text-success font-bold">
                                <InlineMath math={message.complexity.spaceComplexity} />
                              </div>
                            </div>
                            
                            {message.complexity.explanation && (
                              <div className="bg-dark-card border border-dark-border rounded-lg p-3">
                                <p className="text-xs mb-2 text-white flex items-center">
                                  <Info className="w-3 h-3 mr-1 text-info" />
                                  Explanation:
                                </p>
                                <p className="text-gray-300 leading-relaxed text-xs">{message.complexity.explanation}</p>
                              </div>
                            )}
                            
                            {message.complexity.optimizationTips && message.complexity.optimizationTips.length > 0 && (
                              <div className="bg-dark-card border border-dark-border rounded-lg p-3">
                                <p className="mb-2 text-white flex items-center text-xs">
                                  <Sparkles className="w-3 h-3 mr-1 text-warning" />
                                  Tips:
                                </p>
                                <ul className="space-y-1">
                                  {message.complexity.optimizationTips.map((tip, i) => (
                                    <li key={i} className="flex items-start space-x-2">
                                      <span className="text-primary mt-0.5">•</span>
                                      <span className="text-gray-300 leading-relaxed text-xs">{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!message.loading && !message.complexity && (
                          <div className="text-sm prose prose-invert prose-sm max-w-none leading-relaxed">
                            <ReactMarkdown
                              components={{
                                code: ({node, inline, className, children, ...props}) => {
                                  return inline ? (
                                    <code className="bg-dark-card px-1.5 py-0.5 rounded text-primary" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <pre className="bg-dark-card p-3 rounded-lg overflow-x-auto border border-dark-border">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  );
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        
                        <div className="text-xs opacity-60 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-dark-border bg-dark-bg shrink-0">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ask AI anything about your code..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  disabled={isSendingMessage}
                  className="flex-1 input-field text-sm"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-dark-muted mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDE;
