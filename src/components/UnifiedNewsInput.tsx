import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNews } from '@/context/NewsContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';

const UnifiedNewsInput = memo(({ className }: { className?: string }) => {
  const { handleUnifiedInput, status } = useNews();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    textareaRef.current?.focus();
    setIsSubmitting(false);
    setInput('');
    setError('');
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (isSubmitting || status === 'verifying' || status === 'searching') return;
      const value = input.trim();
      if (!value) {
        setError(t('verification.placeholder'));
        return;
      }
      setError('');
      setIsSubmitting(true);
      try {
        await handleUnifiedInput?.(value);
      } catch (err) {
        logger.error('Error in handleUnifiedInput:', err);
        setError(t('errors.serverError'));
        setIsSubmitting(false);
      }
    },
    [input, isSubmitting, status, handleUnifiedInput, t],
  );

  useEffect(() => {
    if (status === 'idle' || status === 'error') setIsSubmitting(false);
  }, [status]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const isProcessing =
    isSubmitting || status === 'verifying' || status === 'searching' || status === 'ranking' || status === 'verified';
  const isUrl = input.trim().match(/^https?:\/\//);

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-primary/30 transition-all">
            {isUrl && (
              <div className="flex items-center gap-2 px-4 pt-3 text-sm text-secondary">
                <LinkIcon className="h-4 w-4" />
                <span>URL detected</span>
              </div>
            )}
            <textarea
              id="search-input"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('verification.placeholder')}
              className="w-full min-h-[140px] px-5 py-4 text-base bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/60"
              disabled={isProcessing}
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
              <div className="text-xs text-muted-foreground hidden sm:block">
                <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-[10px] font-mono mx-1">Ctrl</kbd>+
                <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-[10px] font-mono mx-1">Enter</kbd>
              </div>
              <Button type="submit" disabled={isProcessing || !input.trim()} className="ml-auto">
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {status === 'searching'
                      ? t('common.searching')
                      : status === 'ranking'
                        ? t('common.ranking')
                        : status === 'verifying'
                          ? t('common.verifying')
                          : t('common.loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t('common.verify')}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 px-4 py-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
});

export default UnifiedNewsInput;