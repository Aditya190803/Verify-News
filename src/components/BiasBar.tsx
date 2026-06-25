const BIAS_ORDER = ['left', 'center-left', 'center', 'center-right', 'right', 'unknown'] as const;

const BIAS_COLOR: Record<string, string> = {
  left: 'bg-blue-500',
  'center-left': 'bg-sky-400',
  center: 'bg-gray-400',
  'center-right': 'bg-orange-400',
  right: 'bg-red-500',
  unknown: 'bg-muted-foreground',
};

export function BiasBar({ spread, className }: { spread: Record<string, number>; className?: string }) {
  const total = Object.values(spread).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className={`flex h-2 w-full overflow-hidden rounded-full bg-muted ${className ?? ''}`}>
      {BIAS_ORDER.map((label) => {
        const n = spread[label] ?? 0;
        if (!n) return null;
        return (
          <div
            key={label}
            className={BIAS_COLOR[label] ?? 'bg-muted'}
            style={{ width: `${(n / total) * 100}%` }}
            title={`${label}: ${n}`}
          />
        );
      })}
    </div>
  );
}

export function BiasLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {BIAS_ORDER.filter((l) => l !== 'unknown').map((label) => (
        <span key={label} className="flex items-center gap-1">
          <span className={`inline-block h-2 w-2 rounded-full ${BIAS_COLOR[label]}`} />
          {label}
        </span>
      ))}
    </div>
  );
}