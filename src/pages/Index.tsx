
import React from 'react';
import Header from '@/components/Header';
import NewsForm from '@/components/NewsForm';
import NewsSearch from '@/components/NewsSearch';
import NewsArticles from '@/components/NewsArticles';
import VerificationResult from '@/components/VerificationResult';
import { useNews } from '@/context/NewsContext';
import { Shield, ShieldAlert, FileText, Image, Mic, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

const VerificationContent = () => {
  const { status, articles } = useNews();
  
  return (
    <div className="w-full max-w-6xl mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      {status === 'verified' ? (
        <VerificationResult />
      ) : (
        <>
          <div className="text-center mb-12 max-w-2xl animate-fade-in">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight animate-slide-down">
              Verify news with precision
            </h1>
            <p className="mt-4 text-lg text-foreground/60 leading-relaxed animate-slide-down" style={{ animationDelay: '50ms' }}>
              Our AI-powered tool helps verify the accuracy of news articles, social media posts, and claims by checking against trusted sources.
            </p>
          </div>
          
          {articles.length > 0 ? (
            <NewsArticles />
          ) : (
            <>
              <NewsSearch />
              
              <div className="my-8 text-center text-foreground/60">
                <p>- OR -</p>
              </div>
              
              <NewsForm />
            </>
          )}
          
          <div className="mt-16 w-full max-w-2xl">
            <div className="text-center mb-6">
              <h2 className="text-lg font-medium">Supports multiple input types</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <FileText className="h-5 w-5" />, label: "Text", active: true, description: "Paste text or URLs" },
                { icon: <Image className="h-5 w-5" />, label: "Images", active: true, description: "Upload screenshots" },
                { icon: <Mic className="h-5 w-5" />, label: "Audio", active: true, description: "Upload audio clips" },
                { icon: <Video className="h-5 w-5" />, label: "Video", active: true, description: "Upload video clips" },
              ].map((item, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:border-primary/50",
                    item.active 
                      ? "border-foreground/10 bg-foreground/5" 
                      : "border-dashed border-foreground/10 bg-foreground/5 opacity-40"
                  )}
                  onClick={() => {
                    if (item.active) {
                      // Handle changing input type
                      console.log(`Switching to ${item.label} input type`);
                    }
                  }}
                >
                  <div className="p-2 rounded-full bg-foreground/10">
                    {item.icon}
                  </div>
                  <span className="mt-2 text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-foreground/60 text-center mt-1">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <VerificationContent />
      </main>
      <footer className="py-6 border-t border-foreground/5">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-foreground/40">
          VerifyNews &copy; {new Date().getFullYear()} — A tool for truth in the digital age
        </div>
      </footer>
    </div>
  );
};

export default Index;
