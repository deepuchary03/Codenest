import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2,
  VolumeX,
  Sparkles,
  Loader
} from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        setLastInputWasVoice(true);
        // Auto-send after voice input
        setTimeout(() => handleSendMessage(transcript, true), 500);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice input failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices (needed for voice selection to work properly)
      const loadVoices = () => {
        synthRef.current.getVoices();
      };
      
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          toast.success('Listening... Speak now!');
        } catch (error) {
          console.error('Failed to start recognition:', error);
          toast.error('Could not start voice input');
        }
      } else {
        toast.error('Voice input not supported in your browser');
      }
    }
  };

  const speakText = (text) => {
    if (!synthRef.current || !speechEnabled) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Remove markdown formatting for better speech
    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Get available voices and select a female voice
    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('victoria') ||
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('google us english') ||
      (voice.name.toLowerCase().includes('microsoft') && voice.name.toLowerCase().includes('zira'))
    ) || voices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Female'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    // Smooth, natural voice settings
    utterance.rate = 0.85;  // Slightly slower for clarity
    utterance.pitch = 1.1;   // Slightly higher pitch for feminine tone
    utterance.volume = 0.9;  // Comfortable volume

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (messageText = null, wasVoice = false) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        userMessage: textToSend,
        code: '',
        language: 'python',
        topic: 'General Programming',
        chatHistory: messages.slice(-6)
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const aiResponse = response.data.data?.response || 
                        response.data.reply || 
                        response.data.message || 
                        'I received your message, but I had trouble generating a response. Could you rephrase your question?';

      const aiMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak the response if it was a voice input
      if (wasVoice && speechEnabled) {
        setTimeout(() => speakText(aiResponse), 300);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: `I'm having trouble connecting right now. Here are some general tips:\n\n` +
          `• Start with basic concepts before advanced topics\n` +
          `• Practice regularly to build muscle memory\n` +
          `• Break down complex problems into smaller steps\n` +
          `• Use the roadmap to follow a structured learning path\n\n` +
          `Try asking me again or check your practice lessons!`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLastInputWasVoice(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-full shadow-2xl shadow-primary/50 flex items-center justify-center hover:scale-110 transition-transform z-50 group"
          >
            <Sparkles className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-dark-surface border-2 border-primary rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-purple-500 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Learning Assistant</h3>
                  <p className="text-xs text-white/80">Ask me anything!</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={speechEnabled ? 'Disable voice output' : 'Enable voice output'}
                >
                  {speechEnabled ? (
                    <Volume2 className="w-4 h-4 text-white" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-bg">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-dark-muted">
                  <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm mb-2">Hi! I'm your AI learning assistant</p>
                  <p className="text-xs">Ask me about programming concepts, debugging, or learning tips!</p>
                  <div className="mt-6 space-y-2 text-left">
                    <p className="text-xs text-primary">Try asking:</p>
                    <button
                      onClick={() => setInputText('What are loops and how do I use them?')}
                      className="block w-full text-left px-3 py-2 bg-dark-surface rounded-lg hover:bg-dark-hover text-xs transition-colors"
                    >
                      "What are loops and how do I use them?"
                    </button>
                    <button
                      onClick={() => setInputText('Explain recursion in simple terms')}
                      className="block w-full text-left px-3 py-2 bg-dark-surface rounded-lg hover:bg-dark-hover text-xs transition-colors"
                    >
                      "Explain recursion in simple terms"
                    </button>
                    <button
                      onClick={() => setInputText('How do I debug my code?')}
                      className="block w-full text-left px-3 py-2 bg-dark-surface rounded-lg hover:bg-dark-hover text-xs transition-colors"
                    >
                      "How do I debug my code?"
                    </button>
                  </div>
                </div>
              )}

              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-purple-500 text-white'
                        : 'bg-dark-surface border border-dark-border text-white'
                    }`}
                  >
                    <div className="text-sm prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ node, children, ...props }) => (
                            <div className="mb-2 last:mb-0" {...props}>{children}</div>
                          ),
                          code: ({ node, inline, className, children, ...props }) => {
                            return inline ? (
                              <code className="bg-dark-bg px-1.5 py-0.5 rounded text-primary" {...props}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-dark-bg p-3 rounded-lg overflow-x-auto border border-dark-border my-2">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            );
                          },
                          ul: ({ node, children, ...props }) => (
                            <ul className="list-disc list-inside space-y-1 my-2" {...props}>{children}</ul>
                          ),
                          ol: ({ node, children, ...props }) => (
                            <ol className="list-decimal list-inside space-y-1 my-2" {...props}>{children}</ol>
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div className="text-xs opacity-60 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-dark-surface border border-dark-border rounded-2xl px-4 py-3 flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-dark-muted">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Voice Status */}
            {(isListening || isSpeaking) && (
              <div className="px-4 py-2 bg-primary/10 border-t border-primary/30 flex items-center justify-center space-x-2">
                {isListening && (
                  <>
                    <Mic className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm text-primary font-medium">Listening...</span>
                  </>
                )}
                {isSpeaking && (
                  <>
                    <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm text-primary font-medium">Speaking...</span>
                    <button
                      onClick={stopSpeaking}
                      className="ml-2 px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary-hover transition-colors"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-dark-surface border-t border-dark-border">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything... or use voice 🎤"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl resize-none focus:outline-none focus:border-primary text-sm"
                    rows={2}
                    disabled={isLoading || isListening}
                  />
                </div>
                <button
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  className={`p-3 rounded-xl transition-all ${
                    isListening
                      ? 'bg-error text-white hover:bg-red-600'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading || isListening}
                  className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-dark-muted mt-2 text-center">
                {isListening ? 'Speak clearly into your microphone' : 'Press Enter to send • Click mic for voice input'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
