import { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface HeaderProps {
  className?: string;
}

const Header = memo(({ className }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "See you next time!"
      });
      navigate('/');
    } catch (_error) {
      toast({
        title: "Couldn't log out",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const navLinks = [
    { path: '/feed', label: 'Feed' },
    ...(currentUser ? [{ path: '/dashboard', label: 'Dashboard' }] : []),
    { path: '/about', label: 'About' },
    { path: '/how-it-works', label: 'How it works' },
  ];

  return (
    <header className={cn('w-full py-4 px-4 sm:px-6 bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b border-border/40', className)}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center" aria-label="Navigate to home page">
            <Logo size="md" showText className="hidden sm:flex" />
            <Logo size="sm" showText={false} className="sm:hidden" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "px-4 py-2 text-sm rounded-lg transition-colors",
                isActive(link.path)
                  ? "text-foreground bg-muted font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              aria-label={`Navigate to ${link.label} page`}
              aria-current={isActive(link.path) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-foreground max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </div>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login" aria-label="Sign in to your account">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[65px] z-50 bg-background">
          <nav className="flex flex-col p-4 gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 text-base rounded-lg transition-colors",
                  isActive(link.path)
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
                aria-label={`Navigate to ${link.label} page`}
                aria-current={isActive(link.path) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="h-px bg-border my-4" />
            
            {currentUser ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-lg" aria-label="Current user information">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{currentUser.displayName || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  variant="outline"
                  className="mt-2"
                  aria-label="Sign out of your account"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} aria-label="Sign in to your account">
                <Button className="w-full">Sign in</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
});

export default Header;
