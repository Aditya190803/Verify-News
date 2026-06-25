import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  align = 'left',
  className,
}: PageHeroProps) {
  const centered = align === 'center';
  return (
    <header
      className={cn(
        'border-b border-border/60 bg-muted/25 px-4 sm:px-6 py-12 sm:py-16',
        centered && 'text-center',
        className,
      )}
    >
      <div className={cn('max-w-3xl', centered && 'mx-auto')}>
        {eyebrow ? (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary mb-3">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
        <p
          className={cn(
            'mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[65ch]',
            centered && 'mx-auto',
          )}
        >
          {description}
        </p>
        {children ? <div className={cn('mt-6 flex flex-wrap gap-3', centered && 'justify-center')}>{children}</div> : null}
      </div>
    </header>
  );
}