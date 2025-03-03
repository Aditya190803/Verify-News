
import React, { useState } from 'react';
import { useNews } from '@/context/NewsContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, FileText, SearchX } from 'lucide-react';

interface NewsFormProps {
  className?: string;
}

const NewsForm = ({ className }: NewsFormProps) => {
  const { newsContent, setNewsContent, verifyNews, status } = useNews();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsContent.trim()) {
      setError('Please enter some news content to verify');
      return;
    }
    
    setError('');
    await verifyNews();
  };

  return (
    <div className={cn('w-full animate-fade-in', className)} style={{ animationDelay: '100ms' }}>
      <div className="glass-card p-8 mx-auto max-w-2xl">
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1 mb-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
            <FileText className="h-3.5 w-3.5 mr-1" />
            Text Input
          </div>
          <h2 className="text-xl font-medium text-foreground">Verify news content</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Paste an article, headline, or statement to verify its accuracy using Gemini AI
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <textarea
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="Paste news content here to verify..."
              className="glass-input w-full min-h-[180px] resize-none"
              disabled={status === 'verifying'}
            />
            
            {error && (
              <div className="flex items-center space-x-2 text-sm text-destructive animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="pt-2">
              <Button 
                type="submit"
                disabled={status === 'verifying'} 
                className="glass-button w-full"
              >
                {status === 'verifying' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying with Gemini AI...
                  </span>
                ) : (
                  'Verify Content'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsForm;
