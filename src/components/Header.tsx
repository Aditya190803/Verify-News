
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, LogIn, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Function to check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={cn('w-full py-6 px-4 animate-fade-in', className)}>
      <div className="container max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <ShieldCheck className="h-8 w-8 text-primary animate-slide-in-right" />
          <h1 className="text-2xl font-medium tracking-tight text-foreground animate-slide-in-right" style={{ animationDelay: '50ms' }}>
            <span className="font-semibold">Verify</span>News
          </h1>
        </Link>
        
        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
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
          </Link>
          <ThemeToggle className="mx-1" />
          <Link 
            to="/login" 
            className="ml-2 px-4 py-2 text-sm rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors duration-200 flex items-center gap-1.5"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </Link>
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
              </Link>
              <div className="flex items-center px-4 py-3">
                <span className="text-lg mr-2">Theme:</span>
                <ThemeToggle />
              </div>
              <Link 
                to="/login" 
                className="px-4 py-3 text-lg rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors duration-200 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
