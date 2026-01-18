import ReactMarkdown from "react-markdown";
import { InlineMath } from "react-katex";
import { BarChart3, Info, Sparkles, CheckCircle, X } from "lucide-react";

export default function ChatWindow({ messages, chatEndRef }) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-dark-muted p-4">
        <div className="w-16 h-16 mb-4 opacity-50 flex items-center justify-center">
          <Sparkles className="w-16 h-16" />
        </div>
        <p className="text-sm">AI Assistant is ready to help!</p>
        <p className="text-xs mt-2">
          Ask questions, explain errors, or analyze code complexity.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, idx) => (
        <div
          key={idx}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[85%] rounded-lg p-3 ${
              message.role === "user"
                ? "bg-primary text-white"
                : "bg-dark-bg border border-dark-border"
            }`}
          >
            {message.loading && (
              <div className="flex items-center space-x-2">
                <div className="spinner border-2 border-primary border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
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
                    <p className="text-gray-300 leading-relaxed text-xs">
                      {message.complexity.explanation}
                    </p>
                  </div>
                )}

                {message.complexity.optimizationTips &&
                  message.complexity.optimizationTips.length > 0 && (
                    <div className="bg-dark-card border border-dark-border rounded-lg p-3">
                      <p className="mb-2 text-white flex items-center text-xs">
                        <Sparkles className="w-3 h-3 mr-1 text-warning" />
                        Tips:
                      </p>
                      <ul className="space-y-1">
                        {message.complexity.optimizationTips.map((tip, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="text-gray-300 leading-relaxed text-xs">
                              {tip}
                            </span>
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
                    code: ({ node, inline, className, children, ...props }) => {
                      return inline ? (
                        <code
                          className="bg-dark-card px-1.5 py-0.5 rounded text-primary"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-dark-card p-3 rounded-lg overflow-x-auto border border-dark-border">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            <div className="text-xs opacity-60 mt-2">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
