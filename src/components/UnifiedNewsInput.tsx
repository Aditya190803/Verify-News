import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNews } from '@/context/NewsContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Link as LinkIcon, ImageIcon, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import MediaUpload from './MediaUpload';
import { MediaFile } from '@/types/news';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';

const UnifiedNewsInput = memo(({ className }: { className?: string }) => {
  const { handleUnifiedInput, status, mediaFile, setMediaFile } = useNews();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    setIsSubmitting(false);
    setInput('');
    setError('');
  }, []);

  useEffect(() => {
    return () => {
      setIsSubmitting(false);
    };
  }, []);

  const handleMediaSelect = useCallback((media: MediaFile | null) => {
    setMediaFile(media);
    if (media) {
      setShowMediaUpload(false);
    }
  }, [setMediaFile]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (isSubmitting || status === 'verifying' || status === 'searching') {
      return;
    }
    
    const value = input.trim();
    
    // Allow submission if there's text OR media
    if (!value && !mediaFile) {
      setError(t('verification.placeholder'));
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      if (handleUnifiedInput) {
        await handleUnifiedInput(value, mediaFile || undefined);
      }
    } catch (error) {
      logger.error('Error in handleUnifiedInput:', error);
      setError(t('errors.serverError'));
      setIsSubmitting(false);
    }
  }, [input, mediaFile, isSubmitting, status, handleUnifiedInput, t]);

  useEffect(() => {
    if (status === 'idle' || status === 'error') {
      setIsSubmitting(false);
    }
  }, [status]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isProcessing = isSubmitting || status === 'verifying' || status === 'searching' || status === 'verified';

  // Check if input looks like a URL
  const isUrl = input.trim().match(/^https?:\/\//);

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Main input card */}
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-primary/30 transition-all">
            {/* URL indicator */}
            {isUrl && (
              <div className="flex items-center gap-2 px-4 pt-3 text-sm text-secondary">
                <LinkIcon className="h-4 w-4" />
                <span>URL detected</span>
              </div>
            )}
            
            {/* Media indicator */}
            {mediaFile && (
              <div className="flex items-center gap-2 px-4 pt-3 text-sm text-primary">
                <ImageIcon className="h-4 w-4" />
                <span className="capitalize">{mediaFile.type} attached</span>
                <button
                  type="button"
                  onClick={() => setMediaFile(null)}
                  className="ml-auto p-1 hover:bg-muted rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {/* Media preview (compact) */}
            {mediaFile && (
              <div className="px-4 pt-2">
                <div className="relative bg-muted/30 rounded-lg overflow-hidden">
                  {mediaFile.type === 'image' && mediaFile.preview && (
                    <img 
                      src={mediaFile.preview} 
                      alt="Preview" 
                      className="h-24 w-full object-contain bg-black/5"
                    />
                  )}
                  {mediaFile.type === 'video' && mediaFile.preview && (
                    <video 
                      src={mediaFile.preview} 
                      className="h-24 w-full object-contain bg-black/5"
                    />
                  )}
                  {mediaFile.type === 'audio' && (
                    <audio 
                      src={URL.createObjectURL(mediaFile.file)} 
                      controls 
                      className="w-full p-2"
                    />
                  )}
                </div>
              </div>
            )}
            
            {/* Media upload area (shown when toggled) */}
            {showMediaUpload && !mediaFile && (
              <div className="px-4 pt-4">
                <MediaUpload
                  onMediaSelect={handleMediaSelect}
                  selectedMedia={mediaFile}
                  disabled={isProcessing}
                />
              </div>
            )}
            
            <textarea
              id="search-input"
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mediaFile ? t('verification.placeholder') : t('verification.placeholder')}
              className="w-full min-h-[140px] px-5 py-4 text-base bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/60"
              disabled={isProcessing}
            />
            
            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
              <div className="flex items-center gap-2">
                {/* Media upload toggle button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMediaUpload(!showMediaUpload)}
                  disabled={isProcessing}
                  className={cn(
                    "h-8 px-2 text-muted-foreground hover:text-foreground",
                    showMediaUpload && "text-primary bg-primary/10"
                  )}
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  <span className="text-xs hidden sm:inline">Media</span>
                </Button>
                
                <div className="text-xs text-muted-foreground hidden sm:block">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-[10px] font-mono mx-1">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-[10px] font-mono mx-1">Enter</kbd>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isProcessing || (!input.trim() && !mediaFile)}
                className="ml-auto"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {status === 'searching' ? t('common.searching') : 
                     status === 'ranking' ? t('common.ranking') : 
                     status === 'verifying' ? t('common.verifying') : 
                     t('common.loading')}
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
          
          {/* Error message */}
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
