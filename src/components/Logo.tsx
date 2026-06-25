import React from 'react';
import { cn } from '@/lib/utils';
import { FACETS } from '@/lib/brand';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

/** Facets mark: three angled planes (coverage split), solid brand color */
const Logo = React.memo(({ size = 'md', showText = true, className }: LogoProps) => {
  const sizes = {
    sm: { icon: 24, text: 'text-base' },
    md: { icon: 32, text: 'text-lg' },
    lg: { icon: 40, text: 'text-xl' },
    xl: { icon: 48, text: 'text-2xl' },
  };

  const { icon, text } = sizes[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-hidden
      >
        <rect width="48" height="48" rx="11" className="fill-primary" />
        <path
          d="M14 34V14l10 6v20l-10-6z"
          className="fill-primary-foreground"
          fillOpacity="0.92"
        />
        <path d="M24 20l10-6v20l-10 6V20z" className="fill-primary-foreground" fillOpacity="0.55" />
        <path d="M34 14v20l-6 3.5V17.5L34 14z" className="fill-primary-foreground" fillOpacity="0.35" />
      </svg>
      {showText && (
        <span className={cn('font-semibold tracking-tight text-foreground', text)}>
          {FACETS.name}
        </span>
      )}
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;