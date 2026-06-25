import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type RelatedLink = { to: string; label: string };

export function RelatedLinks({ links, className }: { links: RelatedLink[]; className?: string }) {
  if (!links.length) return null;
  return (
    <nav
      aria-label="Related pages"
      className={cn('px-4 sm:px-6 py-10 border-t border-border/50', className)}
    >
      <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground mr-1">Explore</span>
        {links.map((link, i) => (
          <span key={link.to} className="inline-flex items-center gap-2">
            {i > 0 ? <span aria-hidden className="text-border">·</span> : null}
            <Link to={link.to} className="text-primary hover:underline underline-offset-4">
              {link.label}
            </Link>
          </span>
        ))}
      </div>
    </nav>
  );
}