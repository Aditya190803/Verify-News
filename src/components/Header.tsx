import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, LogIn, LogOut, Menu, X, User, WifiOff, Clock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import SearchHistory from './SearchHistory';

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  
  // Function to check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging you out.",
        variant: "destructive"
      });
    }
  };
  return (
    <header className={cn('w-full py-3 sm:py-4 lg:py-6 px-4 animate-fade-in', className)}>
      <div className="container max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary animate-slide-in-right" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-medium tracking-tight text-foreground animate-slide-in-right" style={{ animationDelay: '50ms' }}>
            <span className="font-semibold">Verify</span>News
          </h1>
        </Link>
          {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">          {/* Mobile search history trigger */}
          {currentUser && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="p-2">
                  <Clock className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <SearchHistory showCloseButton={false} />
              </SheetContent>
            </Sheet>
          )}
          
          <ThemeToggle />
          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-foreground/5 transition-colors duration-200"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
          {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          <Link 
            to="/about" 
            className={cn(
              "px-4 py-2 text-sm rounded-lg hover:bg-foreground/5 transition-colors duration-200",
              isActive('/about') 
                ? "text-foreground bg-foreground/5" 
                : "text-foreground/80 hover:text-foreground"
            )}
          >
            About
          </Link>
          <Link 
            to="/how-it-works" 
            className={cn(
              "px-4 py-2 text-sm rounded-lg hover:bg-foreground/5 transition-colors duration-200",
              isActive('/how-it-works') 
                ? "text-foreground bg-foreground/5" 
                : "text-foreground/80 hover:text-foreground"
            )}
          >
            How It Works
          </Link>          <ThemeToggle className="mx-1" />
          
          {/* Offline indicator */}
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-xs">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </div>
          )}
          
          {currentUser ? (
            <div className="flex items-center gap-2 ml-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-foreground/5 rounded-lg">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground/80">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="ml-2 px-4 py-2 text-sm rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors duration-200 flex items-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
          )}
        </nav>
      </div>
      
      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background animate-fade-in">
          <div className="container max-w-6xl mx-auto px-4 py-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-medium tracking-tight text-foreground">
                  <span className="font-semibold">Verify</span>News
                </h1>
              </Link>
              <button 
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-foreground/5 transition-colors duration-200"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/about" 
                className={cn(
                  "px-4 py-3 text-lg rounded-lg hover:bg-foreground/5 transition-colors duration-200 flex items-center",
                  isActive('/about') 
                    ? "text-foreground bg-foreground/5" 
                    : "text-foreground/80 hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/how-it-works" 
                className={cn(
                  "px-4 py-3 text-lg rounded-lg hover:bg-foreground/5 transition-colors duration-200 flex items-center",
                  isActive('/how-it-works') 
                    ? "text-foreground bg-foreground/5" 
                    : "text-foreground/80 hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>              <div className="flex items-center px-4 py-3">
                <span className="text-lg mr-2">Theme:</span>
                <ThemeToggle />
              </div>
              
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-foreground/5 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-lg text-foreground">
                        {currentUser.displayName || 'User'}
                      </span>
                      <span className="text-sm text-foreground/60">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="mx-4 flex items-center gap-2"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="px-4 py-3 text-lg rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors duration-200 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-5 w-5" />
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
