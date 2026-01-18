import { FileCode, CheckCircle, GripVertical } from "lucide-react";
import FileExplorer from "./FileExplorer";
import TestCases from "./TestCases";

export default function Sidebar({
  width,
  tab,
  onTabChange,
  files,
  activeFile,
  testCases,
  testResults,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onStartDrag,
  isDragging,
}) {
  return (
    <div
      style={{ width: `${width}px` }}
      className="bg-dark-surface border-r border-dark-border flex flex-col relative transition-all duration-200 ease-in-out"
    >
      {/* Tabs */}
      <div className="flex border-b border-dark-border">
        <button
          onClick={() => onTabChange("files")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            tab === "files"
              ? "bg-dark-hover text-primary border-b-2 border-primary"
              : "text-dark-muted hover:text-white"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <FileCode className="w-4 h-4" />
            <span>FILES</span>
          </div>
        </button>
        {testCases && (
          <button
            onClick={() => onTabChange("tests")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              tab === "tests"
                ? "bg-dark-hover text-primary border-b-2 border-primary"
                : "text-dark-muted hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>TESTS</span>
            </div>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "files" && (
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onSelectFile={onSelectFile}
            onAddFile={onAddFile}
            onDeleteFile={onDeleteFile}
          />
        )}
        {tab === "tests" && testCases && (
          <TestCases testCases={testCases} testResults={testResults} />
        )}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onStartDrag();
        }}
        className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-primary transition-colors z-10 group"
        style={{ background: isDragging ? "#6366f1" : "transparent" }}
        title="Drag to resize sidebar"
      >
        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
