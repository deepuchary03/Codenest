import { FileCode, Plus, X } from "lucide-react";

export default function FileExplorer({
  files,
  activeFile,
  onSelectFile,
  onAddFile,
  onDeleteFile,
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Project Files</h3>
        <button
          onClick={onAddFile}
          className="hover:text-primary transition-colors"
          title="Add new file"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => onSelectFile(file)}
            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between group hover:bg-dark-hover transition-colors ${
              activeFile?.name === file.name ? "bg-dark-hover text-primary" : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4" />
              <span>{file.name}</span>
            </div>
            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(file.name);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-error transition-opacity"
                title="Delete file"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
