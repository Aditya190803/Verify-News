import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

/**
 * VerifyNews Logo Component
 * 
 * A modern logo featuring a stylized checkmark within a news/document shape,
 * representing verification and trust in news.
 */
const Logo = React.memo(({ size = 'md', showText = true, className }: LogoProps) => {
  const sizes = {
    sm: { icon: 24, text: 'text-base' },
    md: { icon: 32, text: 'text-lg' },
    lg: { icon: 40, text: 'text-xl' },
    xl: { icon: 56, text: 'text-2xl' },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background rounded square with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(15, 80%, 45%)" />
          </linearGradient>
          <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary-foreground))" />
            <stop offset="100%" stopColor="hsl(var(--primary-foreground))" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        
        {/* Main shape - rounded square with folded corner (document feel) */}
        <path
          d="M8 4h24l12 12v28a4 4 0 01-4 4H8a4 4 0 01-4-4V8a4 4 0 014-4z"
          fill="url(#logoGradient)"
        />
        
        {/* Folded corner accent */}
        <path
          d="M32 4v8a4 4 0 004 4h8"
          fill="none"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
        
        {/* Checkmark - bold and confident */}
        <path
          d="M15 25l6 6 12-14"
          stroke="url(#checkGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Subtle line accents (news lines) */}
        <path
          d="M12 38h16"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        <path
          d="M12 33h10"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.25"
        />
      </svg>

      {/* Text */}
      {showText && (
        <span className={cn('font-semibold text-foreground tracking-tight', text)}>
          Verify<span className="text-primary">News</span>
        </span>
      )}
    </div>
  );
});

export default Logo;
