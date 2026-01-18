import { useEffect, useState } from "react";

export function useResizablePanel(initial, sizes, direction = "left") {
  const [size, setSize] = useState(initial);
  const [dragging, setDragging] = useState(false);

  const snap = (val) =>
    sizes.reduce((a, b) => (Math.abs(b - val) < Math.abs(a - val) ? b : a));

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      const value =
        direction === "left" ? e.clientX : window.innerWidth - e.clientX;
      setSize(Math.max(sizes[0], Math.min(sizes[sizes.length - 1], value)));
    };

    const onUp = () => {
      if (!dragging) return;
      setSize((s) => snap(s));
      setDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    if (dragging) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, sizes, direction]);

  return { size, setDragging };
}
