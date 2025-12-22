import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const KeyboardShortcutsDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const shortcuts = [
    {
      keys: ["Ctrl", "K"],
      description: "Focus search bar",
      os: "all",
    },
    {
      keys: ["Escape"],
      description: "Clear search or close dialog",
      os: "all",
    },
    {
      keys: ["Ctrl", "H"],
      description: "Go to home",
      os: "all",
    },
    {
      keys: ["Ctrl", "D"],
      description: "Go to dashboard",
      os: "all",
    },
    {
      keys: ["Ctrl", "S"],
      description: "Go to settings",
      os: "all",
    },
    {
      keys: ["Alt", "L"],
      description: "Toggle theme",
      os: "all",
    },
    {
      keys: ["Ctrl", "/"],
      description: "Show keyboard shortcuts",
      os: "all",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
            >
              <div className="flex gap-2">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <Badge variant="outline" className="font-mono">
                      {key}
                    </Badge>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {shortcut.description}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4 text-xs text-muted-foreground">
          <p>
            Note: On macOS, use <kbd>Cmd</kbd> instead of <kbd>Ctrl</kbd>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
