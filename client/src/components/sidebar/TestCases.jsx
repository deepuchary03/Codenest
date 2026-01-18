import { CheckCircle, X } from "lucide-react";

export default function TestCases({ testCases, testResults = [] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-border">
        <h3 className="font-semibold text-sm">Test Cases</h3>
        <p className="text-xs text-dark-muted mt-1">
          {testCases?.testCases?.length || 0} test cases to pass
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {testCases?.testCases?.map((testCase, idx) => {
          const result = testResults.find((r) => r.testCase === idx + 1);
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border transition-all ${
                result
                  ? result.passed
                    ? "bg-success/10 border-success"
                    : "bg-error/10 border-error"
                  : "bg-dark-bg border-dark-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    result
                      ? result.passed
                        ? "bg-success text-white"
                        : "bg-error text-white"
                      : "bg-dark-border text-dark-muted"
                  }`}
                >
                  Test #{idx + 1}
                </span>
                {result && (
                  <span
                    className={`text-xs font-bold ${
                      result.passed ? "text-success" : "text-error"
                    }`}
                  >
                    {result.passed ? "✓ PASSED" : "✗ FAILED"}
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
                  <span className="text-dark-muted font-semibold">
                    Expected Output:
                  </span>
                  <pre className="font-mono text-white mt-1 whitespace-pre-wrap break-words">
                    {testCase.expectedOutput}
                  </pre>
                </div>
                {result && result.actual && (
                  <div
                    className={`p-2 rounded ${
                      !result.passed ? "bg-error/20" : "bg-dark-bg/50"
                    }`}
                  >
                    <span className="text-dark-muted font-semibold">
                      Your Output:
                    </span>
                    <pre
                      className={`font-mono mt-1 whitespace-pre-wrap break-words ${
                        !result.passed ? "text-error font-bold" : "text-white"
                      }`}
                    >
                      {result.actual}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
