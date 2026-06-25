import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type PageSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  width?: 'narrow' | 'content' | 'wide';
  tone?: 'default' | 'muted';
};

const widthClass = {
  narrow: 'max-w-2xl',
  content: 'max-w-3xl',
  wide: 'max-w-5xl',
};

export function PageSection({
  title,
  description,
  children,
  className,
  width = 'content',
  tone = 'default',
}: PageSectionProps) {
  return (
    <section
      className={cn(
        'px-4 sm:px-6 py-12 sm:py-14',
        tone === 'muted' && 'bg-muted/20 border-y border-border/50',
        className,
      )}
    >
      <div className={cn('mx-auto', widthClass[width])}>
        {title ? (
          <div className="mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-[60ch] leading-relaxed">{description}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}