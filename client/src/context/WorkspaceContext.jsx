import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // saved, saving, unsaved

  // Auto-save timer
  useEffect(() => {
    if (saveStatus === "unsaved" && currentProject) {
      const timer = setTimeout(() => {
        saveProject();
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [saveStatus, currentProject]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/projects");
      setProjects(response.data);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (projectId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/projects/${projectId}`);
      setCurrentProject(response.data);

      // Set active file
      if (response.data.activeFile) {
        const file = response.data.files.find(
          (f) => f.name === response.data.activeFile
        );
        setActiveFile(file);
      } else if (response.data.files.length > 0) {
        setActiveFile(response.data.files[0]);
      }

      setSaveStatus("saved");
    } catch (error) {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name, description, language) => {
    try {
      const response = await axios.post("/api/projects", {
        name,
        description,
        language,
      });
      setProjects([response.data, ...projects]);
      toast.success("Project created successfully!");
      return response.data;
    } catch (error) {
      toast.error("Failed to create project");
      return null;
    }
  };

  const saveProject = async () => {
    if (!currentProject || saveStatus === "saving") return;

    setSaveStatus("saving");
    try {
      const response = await axios.put(
        `/api/projects/${currentProject._id}`,
        currentProject
      );
      setCurrentProject(response.data);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("unsaved");
      toast.error("Failed to save project");
    }
  };

  const updateFileContent = (fileName, content) => {
    if (!currentProject) return;

    const updatedFiles = currentProject.files.map((file) =>
      file.name === fileName
        ? { ...file, content, lastModified: new Date() }
        : file
    );

    setCurrentProject({ ...currentProject, files: updatedFiles });

    if (activeFile?.name === fileName) {
      setActiveFile({ ...activeFile, content });
    }

    setSaveStatus("unsaved");
  };

  const addFile = (name, language) => {
    if (!currentProject) return;

    const newFile = {
      name,
      content: "",
      language,
      lastModified: new Date(),
    };

    setCurrentProject({
      ...currentProject,
      files: [...currentProject.files, newFile],
    });

    setSaveStatus("unsaved");
    return newFile;
  };

  const deleteFile = (fileName) => {
    if (!currentProject) return;

    const updatedFiles = currentProject.files.filter(
      (f) => f.name !== fileName
    );
    setCurrentProject({ ...currentProject, files: updatedFiles });

    if (activeFile?.name === fileName) {
      setActiveFile(updatedFiles[0] || null);
    }

    setSaveStatus("unsaved");
  };

  const deleteProject = async (projectId) => {
    try {
      await axios.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter((p) => p._id !== projectId));
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        projects,
        currentProject,
        activeFile,
        loading,
        saveStatus,
        loadProjects,
        loadProject,
        createProject,
        saveProject,
        updateFileContent,
        addFile,
        deleteFile,
        deleteProject,
        setActiveFile,
        setSaveStatus,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
