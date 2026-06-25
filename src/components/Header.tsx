import { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  className?: string;
}

const primaryNav = [
  { path: '/feed', label: 'Feed' },
  { path: '/following', label: 'Following' },
  { path: '/pricing', label: 'Pricing' },
] as const;

const Header = memo(({ className }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: t('auth.toastLoggedOutTitle'), description: t('auth.toastLoggedOutDesc') });
      navigate('/');
    } catch {
      toast({
        title: t('auth.toastLogoutFailedTitle'),
        description: t('auth.toastLogoutFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const navClass = (path: string) =>
    cn(
      'text-sm transition-colors',
      isActive(path) ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
    );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border/50 bg-background/95',
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="Facets home">
          <Logo size="sm" showText className="sm:hidden" />
          <Logo size="md" showText className="hidden sm:flex" />
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Main">
          {primaryNav.map((link) => (
            <Link key={link.path} to={link.path} className={navClass(link.path)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 max-w-[10rem]">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('dashboard.title')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('common.settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                  <LanguageSwitcher />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleLogout()} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>
              <Button size="sm" asChild>
                <Link to="/login">{t('auth.signIn')}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-md text-foreground hover:bg-muted"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? t('aria.closeMobileMenu') : t('aria.openMobileMenu')}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background px-4 py-3 pb-5">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {primaryNav.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={cn('rounded-md px-3 py-2.5', navClass(link.path), isActive(link.path) && 'bg-muted/60')}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={cn('rounded-md px-3 py-2.5', navClass('/'))}
            >
              {t('common.verify')}
            </Link>
          </nav>
          <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-3">
            <LanguageSwitcher />
            {currentUser ? (
              <>
                <p className="px-3 text-xs text-muted-foreground truncate">{currentUser.email}</p>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm">
                  {t('dashboard.title')}
                </Link>
                <Link to="/settings" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm">
                  {t('common.settings')}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="mx-3"
                  onClick={() => {
                    void handleLogout();
                    setMobileOpen(false);
                  }}
                >
                  {t('auth.signOut')}
                </Button>
              </>
            ) : (
              <Button size="sm" className="mx-3" asChild>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  {t('auth.signIn')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
