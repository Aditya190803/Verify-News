
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CTASection = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-card border border-border">
        <div>
          <h3 className="text-xl font-semibold mb-2">Explore recent verifications</h3>
          <p className="text-muted-foreground">See what others have checked</p>
        </div>
        <Link to="/feed">
          <Button variant="outline" size="lg" className="group">
            <TrendingUp className="h-4 w-4 mr-2" />
            Browse feed
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CTASection;
