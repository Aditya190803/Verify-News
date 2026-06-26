import { cn } from '@/lib/utils';

const STYLES: Record<string, string> = {
  'very-high': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  high: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  mixed: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  low: 'bg-red-500/15 text-red-700 dark:text-red-400',
  unknown: 'bg-muted text-muted-foreground',
};

export function FactualityBadge({ tier, className }: { tier?: string | null; className?: string }) {
  const t = (tier ?? 'unknown').toLowerCase();
  const label = t === 'very-high' ? 'Very high' : t.charAt(0).toUpperCase() + t.slice(1);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        STYLES[t] ?? STYLES.unknown,
        className,
      )}
      title={`Factuality: ${label}`}
    >
      {label}
    </span>
  );
}