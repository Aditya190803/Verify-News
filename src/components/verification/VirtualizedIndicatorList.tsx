import { memo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export const VirtualizedIndicatorList = memo(function VirtualizedIndicatorList({
  indicators,
  height = 200,
  itemHeight = 32,
}: {
  indicators: string[];
  height?: number;
  itemHeight?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleItems = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems + 2, indicators.length);
  const visibleIndicators = indicators.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: Math.min(height, indicators.length * itemHeight) }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: indicators.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleIndicators.map((indicator, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              <div className="flex items-start gap-2 text-sm text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <span>{indicator}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});