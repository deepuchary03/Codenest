import { useEffect } from "react";

export function useKeyboardShortcuts({ toggleConsole, toggleAI }) {
  useEffect(() => {
    const handler = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;

      if (e.key === "j") {
        e.preventDefault();
        toggleConsole();
      }
      if (e.key === "k") {
        e.preventDefault();
        toggleAI();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleConsole, toggleAI]);
}
