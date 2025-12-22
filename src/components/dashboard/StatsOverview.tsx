import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface StatsOverviewProps {
  total: number;
  trueCount: number;
  falseCount: number;
  uncertainCount: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ total, trueCount, falseCount, uncertainCount }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card className="p-5">
        <p className="text-sm text-muted-foreground mb-1">Total verified</p>
        <p className="text-3xl font-bold">{total}</p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="h-4 w-4 text-success" />
          <p className="text-sm text-muted-foreground">True</p>
        </div>
        <p className="text-3xl font-bold text-success">{trueCount}</p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <XCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-muted-foreground">False</p>
        </div>
        <p className="text-3xl font-bold text-destructive">{falseCount}</p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="h-4 w-4 text-warning" />
          <p className="text-sm text-muted-foreground">Uncertain</p>
        </div>
        <p className="text-3xl font-bold text-warning">{uncertainCount}</p>
      </Card>
    </div>
  );
};

export default StatsOverview;
