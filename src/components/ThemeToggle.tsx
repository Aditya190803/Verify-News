import { useEffect, useState, memo, KeyboardEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = memo(({ className }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("dark");

  // Track system theme changes to show the correct icon for system mode
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };
    
    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  const toggleTheme = () => {
    // If currently on system, switch to the opposite of current system theme
    if (theme === "system") {
      setTheme(systemTheme === "dark" ? "light" : "dark");
    } else {
      // Toggle between light and dark
      setTheme(theme === "light" ? "dark" : "light");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      // Show the current system theme icon
      return systemTheme === "dark" ? Moon : Sun;
    } else if (theme === "light") {
      return Sun;
    } else {
      return Moon;
    }
  };

  const getLabel = () => {
    if (theme === "system") {
      return `System theme (${systemTheme})`;
    } else if (theme === "light") {
      return "Light theme";
    } else {
      return "Dark theme";
    }
  };

  const Icon = getIcon();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      }}
      className={cn("rounded-full", className)}
      aria-label={getLabel()}
      title={getLabel()}
      tabIndex={0}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
});
