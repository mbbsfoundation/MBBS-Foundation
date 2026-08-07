"use client";

import { useEffect } from "react";

export default function SecurityGuard() {
  useEffect(() => {
    // Disable right click context menu everywhere EXCEPT inside form inputs
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return; // Allow normal right-click inside form controls
      }
      e.preventDefault();
    };

    // Disable copy/cut/select-all keyboard shortcuts outside form inputs
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isInput) return; // Allow normal copy/paste inside form inputs

      // Prevent Cmd+C / Ctrl+C / Cmd+U (View Source) outside form inputs
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "c" || e.key === "C" || e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
