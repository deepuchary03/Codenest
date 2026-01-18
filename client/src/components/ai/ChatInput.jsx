import { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, disabled = false }) {
  const [value, setValue] = useState("");

  const send = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="p-4 border-t border-dark-border bg-dark-bg shrink-0">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask AI anything about your code..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="flex-1 input-field text-sm"
        />
        <button
          onClick={send}
          disabled={!value.trim() || disabled}
          className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-dark-muted mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
