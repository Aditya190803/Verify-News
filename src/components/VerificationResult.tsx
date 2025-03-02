
import React from 'react';
import { useNews } from '@/context/NewsContext';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VerificationResultProps {
  className?: string;
}

const VerificationResult = ({ className }: VerificationResultProps) => {
  const { result, status, resetState } = useNews();

  if (status !== 'verified' || !result) return null;

  const getStatusIcon = () => {
    switch (result.veracity) {
      case 'true':
        return <Check className="h-6 w-6 text-truth" />;
      case 'false':
        return <X className="h-6 w-6 text-falsehood" />;
      case 'partially-true':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (result.veracity) {
      case 'true':
        return 'bg-truth/10 text-truth border-truth/20';
      case 'false':
        return 'bg-falsehood/10 text-falsehood border-falsehood/20';
      case 'partially-true':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-neutral/10 text-neutral border-neutral/20';
    }
  };

  const getStatusText = () => {
    switch (result.veracity) {
      case 'true':
        return 'True';
      case 'false':
        return 'False';
      case 'partially-true':
        return 'Partially True';
      default:
        return 'Unverified';
    }
  };

  return (
    <div className={cn('w-full animate-scale-in', className)}>
      <div className="glass-card p-8 mx-auto max-w-2xl overflow-hidden">
        <div className="flex items-center mb-6">
          <div className={cn("flex items-center justify-center p-2 rounded-full", 
            result.veracity === 'true' ? "bg-truth/10" : 
            result.veracity === 'false' ? "bg-falsehood/10" : 
            "bg-amber-500/10"
          )}>
            {getStatusIcon()}
          </div>
          <div className="ml-4">
            <div className={cn("inline-flex items-center px-3 py-1 text-xs font-medium rounded-full", getStatusColor())}>
              {getStatusText()}
              <span className="ml-1 text-xs opacity-70">{result.confidence}% confidence</span>
            </div>
            <h2 className="text-xl font-medium text-foreground mt-1">Verification Complete</h2>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground/80">Analysis</h3>
            <p className="text-foreground text-base leading-relaxed">{result.explanation}</p>
          </div>
          
          {result.correctedInfo && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground/80">Corrected Information</h3>
              <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                <p className="text-foreground text-base leading-relaxed">{result.correctedInfo}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground/80">Sources</h3>
            <div className="space-y-2">
              {result.sources.map((source, index) => (
                <a 
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors duration-200 group"
                >
                  <span className="text-foreground">{source.name}</span>
                  <ExternalLink className="h-4 w-4 text-foreground/40 group-hover:text-foreground/80 transition-colors duration-200" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-4 pt-2">
            <Button 
              onClick={resetState}
              variant="outline"
              className="flex-1 border border-foreground/10 bg-background/50 hover:bg-foreground/5"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verify Another
            </Button>
            <Button 
              variant="default"
              className="flex-1 glass-button"
              onClick={() => {
                // Copy to clipboard functionality would go here
                navigator.clipboard.writeText(`Verification Result: ${getStatusText()}\n\n${result.explanation}\n\nSources: ${result.sources.map(s => s.name).join(', ')}`);
                // Show toast notification
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationResult;
