import { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  timestamp: string;
}

const TrendingAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      title: 'AI-generated video of world leader circulating on social media',
      severity: 'high',
      category: 'Deepfake',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'False claims about new health regulations in Europe',
      severity: 'medium',
      category: 'Health',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      title: 'Misleading financial advice trending on TikTok',
      severity: 'low',
      category: 'Finance',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Occasionally add a new mock alert
      if (Math.random() > 0.7) {
        const newAlert: Alert = {
          id: Math.random().toString(36).substr(2, 9),
          title: `New trending misinformation about ${['Climate', 'Elections', 'Technology', 'Celebrities'][Math.floor(Math.random() * 4)]}`,
          severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as Alert['severity'],
          category: 'Trending',
          timestamp: new Date().toISOString(),
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <Bell className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold">Real-time Alerts</h2>
        </div>
        <Badge variant="outline" className="animate-pulse bg-red-50 text-red-600 border-red-200">
          Live Updates
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="p-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] uppercase font-bold",
                  alert.severity === 'high' ? "bg-red-100 text-red-700" :
                  alert.severity === 'medium' ? "bg-orange-100 text-orange-700" :
                  "bg-blue-100 text-blue-700"
                )}
              >
                {alert.severity} Risk
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Trending
              </span>
            </div>
            <h3 className="text-sm font-semibold mb-3 line-clamp-2">{alert.title}</h3>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] text-muted-foreground">{alert.category}</span>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1">
                Verify <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrendingAlerts;
