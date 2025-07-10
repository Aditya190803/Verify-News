import React, { useState, useRef, useEffect } from 'react';
import { useNews } from '@/context/NewsContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const isUrl = (str: string) => /^https?:\/\/.+/.test(str.trim());
const isLikelyTopic = (str: string) => str.trim().length > 0 && str.trim().length < 80 && !str.includes(' ');

const UnifiedNewsInput = ({ className }: { className?: string }) => {
  const { handleUnifiedInput, status } = useNews();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when component mounts and reset submitting state
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    // Reset submitting state when component mounts (e.g., returning to home page)
    setIsSubmitting(false);
  }, []);

  // Reset submitting state when component unmounts
  useEffect(() => {
    return () => {
      setIsSubmitting(false);
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting || status === 'verifying' || status === 'searching') {
      return;
    }
    
    const value = input.trim();
    if (!value) {
      setError('Please enter a link, topic, or news content.');
      return;
    }
    
    setError('');
    setIsSubmitting(true); // Set local state immediately
    
    try {
      await handleUnifiedInput(value);
    } catch (error) {
      console.error('Error in handleUnifiedInput:', error);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false); // Reset on error
    }
  };

  // Reset submitting state when status changes to idle or error
  // Don't reset on 'verified' because navigation is about to happen
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

  return (
    <div className={cn('w-full animate-fade-in', className)} style={{ animationDelay: '100ms' }}>
      <div className="glass-card dark:bg-gray-800/60 dark:border-gray-700/50 p-4 sm:p-6 lg:p-8 mx-auto max-w-2xl">
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex items-center px-2.5 sm:px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
            <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            News, Link, or Content
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-foreground">Verify or Search News</h2>
          <p className="mt-1 text-xs sm:text-sm text-foreground/60">
            Paste a link, enter a topic, or paste news content to verify or search. Press Ctrl+Enter to submit.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a link, topic, or news content here..."
              className="glass-input dark:bg-gray-700/50 dark:border-gray-600/50 w-full min-h-[80px] sm:min-h-[120px] resize-none text-sm sm:text-base"
              disabled={isProcessing}
            />
            {error && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-destructive animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isProcessing}
                className="glass-button dark:bg-primary/90 dark:hover:bg-primary/80 w-full text-sm sm:text-base"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs sm:text-sm">Processing...</span>
                  </span>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedNewsInput;
