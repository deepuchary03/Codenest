import { useRef } from "react";
import Editor from "@monaco-editor/react";

export default function EditorPane({ file, onChange }) {
  const editorRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-dark-muted bg-dark-bg">
        <p>No file selected</p>
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language={file.language}
      value={file.content}
      onChange={onChange}
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
  );
}
