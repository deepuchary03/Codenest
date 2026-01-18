import { Sparkles, CheckCircle, X } from "lucide-react";

export default function ConsolePane({
  output,
  input,
  onInputChange,
  metrics,
  testResults = [],
  hasError,
  onExplainError,
}) {
  return (
    <div className="h-full flex flex-col bg-dark-surface border-t border-dark-border">
      <div className="px-4 py-2 border-b border-dark-border flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm">CONSOLE</h3>
        {metrics && (
          <div className="flex items-center space-x-4 text-xs text-dark-muted">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded">
              ⚡ {metrics.time}ms
            </span>
            <span className="px-2 py-1 bg-success/10 text-success rounded">
              💾 {metrics.memory}MB
            </span>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-b border-dark-border shrink-0">
        <input
          type="text"
          placeholder="Input (optional) - Enter values separated by spaces or newlines"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
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
              <h3 className="font-bold text-lg text-white">
                Test Case Results
              </h3>
              <div className="text-sm text-dark-muted">
                {testResults.filter((r) => r.passed).length} /{" "}
                {testResults.length} Passed
              </div>
            </div>
            <div className="grid gap-3">
              {testResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    result.passed
                      ? "bg-success/10 border-success shadow-lg shadow-success/20"
                      : "bg-error/10 border-error shadow-lg shadow-error/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          result.passed
                            ? "bg-success text-white"
                            : "bg-error text-white"
                        }`}
                      >
                        Test #{result.testCase}
                      </span>
                      <span className="text-xs text-dark-muted">
                        {result.description}
                      </span>
                    </div>
                    <span
                      className={`font-bold text-sm flex items-center space-x-1 ${
                        result.passed ? "text-success" : "text-error"
                      }`}
                    >
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
                      <div className="font-mono text-white mt-1">
                        {result.input}
                      </div>
                    </div>
                    <div className="bg-dark-bg/50 p-2 rounded">
                      <span className="text-dark-muted">Expected:</span>
                      <div className="font-mono text-white mt-1">
                        {result.expected}
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded ${
                        !result.passed ? "bg-error/20" : "bg-dark-bg/50"
                      }`}
                    >
                      <span className="text-dark-muted">Actual:</span>
                      <div
                        className={`font-mono mt-1 ${
                          !result.passed ? "text-error font-bold" : "text-white"
                        }`}
                      >
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

      {hasError && onExplainError && (
        <div className="px-4 py-2 border-t border-dark-border shrink-0">
          <button
            onClick={onExplainError}
            className="btn-secondary text-sm flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explain Error (AI Mentor)</span>
          </button>
        </div>
      )}
    </div>
  );
}
