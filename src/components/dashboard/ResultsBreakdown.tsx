import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResultsBreakdownProps {
  total: number;
  trueCount: number;
  falseCount: number;
  uncertainCount: number;
}

const ResultsBreakdown: React.FC<ResultsBreakdownProps> = ({ total, trueCount, falseCount, uncertainCount }) => {
  const items = [
    { label: 'True', count: trueCount, color: 'bg-success' },
    { label: 'False', count: falseCount, color: 'bg-destructive' },
    { label: 'Uncertain', count: uncertainCount, color: 'bg-warning' },
  ];

  return (
    <Card className="p-6 mb-8">
      <h2 className="font-semibold mb-6">Results breakdown</h2>
      
      <div className="space-y-4">
        {items.map((item) => {
          const percentage = total > 0 
            ? Math.round((item.count / total) * 100) 
            : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span>{item.label}</span>
                <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", item.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ResultsBreakdown;
