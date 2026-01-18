import { useState, useRef, useEffect } from "react";
import { api } from "../api/client";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content, context = {}) => {
    if (!content.trim()) return;

    const userMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const loadingMessage = {
      role: "assistant",
      content: "Thinking...",
      loading: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, loadingMessage]);
    setSending(true);

    try {
      const response = await api.post("/ai/chat", {
        message: content,
        ...context,
      });

      const aiMessage = {
        role: "assistant",
        content: response.data.reply || response.data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev.filter((m) => !m.loading), aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage = {
        role: "assistant",
        content:
          "I'm having trouble connecting. Please try again or use the Analyze/Explain Error buttons for specific help.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev.filter((m) => !m.loading), errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const addComplexityAnalysis = (complexityData) => {
    const message = {
      role: "assistant",
      content: "",
      complexity: complexityData,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  return {
    messages,
    sendMessage,
    sending,
    chatEndRef,
    setMessages,
    addComplexityAnalysis,
  };
}
