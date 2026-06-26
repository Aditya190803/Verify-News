import { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '@/components/Logo';
import { ClerkNavAuth } from '@/components/auth/ClerkNavAuth';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  className?: string;
}

const primaryNav = [
  { path: '/feed', label: 'Feed' },
  { path: '/blindspot', label: 'Blindspot' },
  { path: '/following', label: 'Following' },
  { path: '/pricing', label: 'Pricing' },
] as const;

const Header = memo(({ className }: HeaderProps) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

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
          <ClerkNavAuth />
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
          <div className="mt-4 pt-4 border-t border-border/50">
            <ClerkNavAuth compact />
          </div>
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

export default Header;