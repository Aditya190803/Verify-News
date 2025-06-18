import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

const TestIndex = () => {
  console.log("TestIndex component rendering...");
  
  const handleClick = () => {
    alert("Button clicked!");
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center">VerifinNews Test Page</h1>
        <p className="text-base sm:text-lg mb-6 sm:mb-8 text-center text-foreground/70">
          If you can see this, the basic React app is working!
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Button onClick={handleClick} className="bg-blue-500 hover:bg-blue-600 text-sm sm:text-base">
            Test Button 1
          </Button>
          
          <Button onClick={handleClick} variant="secondary" className="text-sm sm:text-base">
            Test Button 2
          </Button>
          
          <Button onClick={handleClick} variant="outline" className="text-sm sm:text-base sm:col-span-2 lg:col-span-1">
            Test Button 3
          </Button>
        </div>
        
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Environment Check:</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span>Node Environment:</span>
              <Badge variant="outline">{import.meta.env.MODE}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span>Firebase API Key:</span>
              <div className="flex items-center gap-2">
                {import.meta.env.VITE_FIREBASE_API_KEY ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Connected</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Missing</Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span>Gemini API Key:</span>
              <div className="flex items-center gap-2">
                {import.meta.env.VITE_GEMINI_API_KEY ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Connected</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Missing</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestIndex;
