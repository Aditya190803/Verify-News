import { memo, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export const VirtualizedFactCheckGrid = memo(function VirtualizedFactCheckGrid({
  items,
  height = 250,
  itemHeight = 80,
}: {
  items: { source: string; verdict: string; url?: string }[];
  height?: number;
  itemHeight?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsPerRow = 2;
  const visibleRows = Math.ceil(height / itemHeight);
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const startRow = Math.floor(scrollTop / itemHeight);
  const endRow = Math.min(startRow + visibleRows + 2, totalRows);
  const visibleItems: { item: (typeof items)[0]; index: number }[] = [];
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < itemsPerRow; col++) {
      const index = row * itemsPerRow + col;
      if (index < items.length) visibleItems.push({ item: items[index], index });
    }
  }
  const offsetY = startRow * itemHeight;

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: Math.min(height, totalRows * itemHeight) }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalRows * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleItems.map(({ item, index }) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{item.source}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase',
                      item.verdict.toLowerCase().includes('true') ? 'bg-green-100 text-green-700' :
                      item.verdict.toLowerCase().includes('false') ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700',
                    )}
                  >
                    {item.verdict}
                  </span>
                </div>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                    View full report <ExternalLink className="h-2 w-2" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});