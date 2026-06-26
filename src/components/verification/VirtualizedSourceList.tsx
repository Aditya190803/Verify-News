import { memo, useRef, useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { RELIABLE_SOURCES } from '@/lib/constants';

export const VirtualizedSourceList = memo(function VirtualizedSourceList({
  sources,
  height = 300,
  itemHeight = 56,
}: {
  sources: { name: string; url: string }[];
  height?: number;
  itemHeight?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleItems = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems + 2, sources.length);
  const visibleSources = sources.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: Math.min(height, sources.length * itemHeight) }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: sources.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleSources.map((source, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{source.name}</span>
                  {RELIABLE_SOURCES.some((rs) => source.name.toLowerCase().includes(rs.toLowerCase())) && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">
                      <ShieldCheck className="h-3 w-3" />
                      Trusted
                    </div>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});