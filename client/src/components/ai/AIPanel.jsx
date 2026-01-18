import { Brain, X, GripVertical } from "lucide-react";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";

export default function AIPanel({
  width,
  onClose,
  onStartDrag,
  messages,
  onSend,
  chatEndRef,
  isDragging,
}) {
  return (
    <div
      style={{ width: `${width}px` }}
      className="bg-dark-surface border-l-2 border-primary flex flex-col relative shrink-0 transition-all duration-200 ease-in-out"
    >
      {/* Resize Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStartDrag();
        }}
        className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-primary transition-all z-50 group"
        style={{
          background: isDragging ? "#6366f1" : "transparent",
          marginLeft: "-4px",
        }}
        title="Drag to resize AI panel"
      >
        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-primary" />
        </div>
      </div>

      <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-bg">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="hover:text-error transition-colors"
          title="Close AI Panel (Ctrl+K)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <ChatWindow messages={messages} chatEndRef={chatEndRef} />
      <ChatInput onSend={onSend} />
    </div>
  );
}
