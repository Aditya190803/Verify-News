
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SocialLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { socialLogin } = useAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      await socialLogin('google');
      toast({
        title: "Login successful",
        description: "Welcome to VerifyNews!"
      });
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Google login failed",
        description: "There was an error logging in with your Google account.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H12.7V12.0492H16.9693C16.8098 13.2911 16.1693 14.3898 15.1187 15.0879V17.5866H18.2017C19.9558 16.8449 21.3093 14.2783 21.3081 10.2303Z"
              fill="#3E82F1"
            />
            <path
              d="M12.7 20.2701C15.1693 20.2701 17.2693 19.3941 18.2017 17.5866L15.1187 15.0879C14.3627 15.6338 13.6489 15.9578 12.7 15.9578C10.5424 15.9578 8.71147 14.4553 8.16334 12.4164H5.00334V14.9658C6.27428 18.0873 9.5592 20.2701 12.7 20.2701Z"
              fill="#32A753"
            />
            <path
              d="M8.16335 12.4163C8.02639 11.8683 7.9467 11.2828 7.9467 10.697C7.9467 9.80564 8.09502 8.95478 8.32168 8.15674V5.60718H5.00334C4.35168 7.18637 4 8.90654 4 10.697C4 12.1895 4.25079 13.6564 4.72423 15.0064L8.16335 12.4163Z"
              fill="#F9BB00"
            />
            <path
              d="M12.7 5.42822C14.1331 5.42822 15.4148 5.98632 16.3933 6.91304L19.1037 4.20339C17.2647 2.50507 15.1693 1.5 12.7 1.5C9.5592 1.5 6.27428 3.68285 5.00334 6.80565L8.32168 9.35522C8.7775 7.31623 10.5987 5.42822 12.7 5.42822Z"
              fill="#E74133"
            />
          </svg>
          {isLoading ? "Signing in..." : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
};

export default SocialLogin;
