import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { History, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchHistory from '@/components/SearchHistory';
import { useAuth } from '@/context/AuthContext';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

/**
 * HistorySidebar - A proper sidebar for search history
 * 
 * Features:
 * - Slide-in animation from left
 * - Floating toggle button when closed
 * - Full-height sidebar with proper scrolling
 * - Backdrop overlay on mobile
 * - Keyboard accessible (Escape to close)
 */
const HistorySidebar = ({ isOpen, onClose, onOpen }: HistorySidebarProps) => {
  const { currentUser } = useAuth();

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render anything if user is not logged in
  if (!currentUser) {
    return null;
  }

  return (
    <>
      {/* Floating Toggle Button - visible when sidebar is closed */}
      <button
        onClick={onOpen}
        className={cn(
          'fixed left-4 bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full',
          'bg-card border border-border shadow-lg',
          'text-foreground hover:bg-muted transition-all duration-300',
          'hover:shadow-xl hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isOpen ? 'opacity-0 pointer-events-none translate-x-[-20px]' : 'opacity-100'
        )}
        aria-label="Open search history"
      >
        <History className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium hidden sm:inline">History</span>
      </button>

      {/* Backdrop - mobile only */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw]',
          'bg-background border-r border-border',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Search history"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">History</h2>
              <p className="text-xs text-muted-foreground">Your searches & verifications</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-muted"
            aria-label="Close history sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          <SearchHistory 
            onClose={onClose}
            showCloseButton={false}
            className="h-full"
          />
        </div>

        {/* Collapse indicator on desktop */}
        <button
          onClick={onClose}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
      </aside>
    </>
  );
};

export default HistorySidebar;
