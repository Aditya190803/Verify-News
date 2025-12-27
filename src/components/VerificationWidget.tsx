import React, { useState } from 'react';
import { Search, Shield, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useNewsState } from '@/hooks/useNewsState';

interface VerificationWidgetProps {
  compact?: boolean;
  className?: string;
}

/**
 * VerificationWidget
 * 
 * A standalone, embeddable-ready component that provides quick news verification.
 * Can be used in sidebars, footers, or as a floating element.
 */
export const VerificationWidget: React.FC<VerificationWidgetProps> = ({ 
  compact = false,
  className 
}) => {
  const { 
    searchQuery, 
    setSearchQuery, 
    handleUnifiedInput, 
    status, 
    result 
  } = useNewsState();
  
  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    await handleUnifiedInput(searchQuery);
  };

  const getVeracityIcon = () => {
    if (!result) return <Shield className="w-5 h-5 text-muted-foreground" />;
    
    switch (result.veracity) {
      case 'verified':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'misleading':
      case 'false':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <HelpCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getVeracityColor = () => {
    if (!result) return 'text-muted-foreground';
    
    switch (result.veracity) {
      case 'verified': return 'text-green-600 dark:text-green-400';
      case 'misleading':
      case 'false': return 'text-destructive';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  return (
    <Card className={cn('overflow-hidden transition-all duration-300 shadow-lg border-primary/20', 
      isExpanded ? 'w-full max-w-md' : 'w-12 h-12 rounded-full p-0 flex items-center justify-center cursor-pointer',
      className
    )}>
      {!isExpanded ? (
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full w-full h-full"
          onClick={() => setIsExpanded(true)}
        >
          <Shield className="w-6 h-6 text-primary" />
        </Button>
      ) : (
        <>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              VerifyNews Widget
            </CardTitle>
            {compact && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => setIsExpanded(false)}
              >
                ×
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <form onSubmit={handleVerify} className="flex gap-2 mt-2">
              <Input
                placeholder="Paste URL or news text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-xs"
                disabled={status === 'verifying' || status === 'searching' || status === 'ranking' || status === 'verified'}
              />
              <Button 
                type="submit" 
                size="sm" 
                className="h-9 px-3"
                disabled={status === 'verifying' || status === 'searching' || status === 'ranking' || status === 'verified' || !searchQuery.trim()}
              >
                {status === 'verifying' || status === 'searching' || status === 'ranking' || status === 'verified' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-1">
                  {getVeracityIcon()}
                  <span className={cn('text-xs font-bold uppercase tracking-wider', getVeracityColor())}>
                    {result.veracity}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {Math.round(result.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-xs line-clamp-3 text-foreground/80 leading-relaxed">
                  {result.explanation}
                </p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-[10px] mt-2 text-primary"
                  onClick={() => window.open(`/result/${result.id || ''}`, '_blank')}
                >
                  View Full Report →
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-2 bg-muted/30 flex justify-center">
            <p className="text-[9px] text-muted-foreground">
              Powered by VerifyNews AI
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
};
