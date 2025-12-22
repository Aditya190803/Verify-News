import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";

interface KeyboardShortcutsConfig {
  onSearch?: () => void;
  onClear?: () => void;
  onFocus?: (id: string) => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig = {}) => {
  const navigate = useNavigate();
  const { onSearch, onClear, onFocus } = config;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key press is in an input or textarea (except for search)
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Ctrl+K or Cmd+K: Focus search
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
          searchInput.focus();
          onFocus?.("search-input");
        }
      }

      // Escape: Clear search or close modals
      if (event.key === "Escape") {
        if (isInputElement) {
          const input = target as HTMLInputElement;
          if (input.value) {
            input.value = "";
            onClear?.();
          } else {
            input.blur();
          }
        }
      }

      // Ctrl+H or Cmd+H: Go to home
      if ((event.ctrlKey || event.metaKey) && event.key === "h") {
        event.preventDefault();
        navigate("/");
      }

      // Ctrl+D or Cmd+D: Go to dashboard
      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        navigate("/dashboard");
      }

      // Ctrl+S or Cmd+S: Go to settings
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        navigate("/settings");
      }

      // Ctrl+/ or Cmd+/: Show help/keyboard shortcuts
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();
        // This could open a help modal
        // For now, we'll just log it
        logger.info("Keyboard shortcuts help should be displayed");
      }

      // Alt+L: Toggle theme (Light/Dark/System)
      if (event.altKey && event.key === "l") {
        event.preventDefault();
        const currentTheme = localStorage.getItem("theme") || "system";
        const themes = ["light", "dark", "system"];
        const currentIndex = themes.indexOf(currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        localStorage.setItem("theme", nextTheme);
        // Trigger a custom event for theme change
        window.dispatchEvent(
          new CustomEvent("themeChange", { detail: { theme: nextTheme } })
        );
      }

      // Ctrl+F or Cmd+F: Search (override browser default if needed)
      // Note: We let browser handle this naturally
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, onSearch, onClear, onFocus]);
};
