
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

type LoginFormProps = {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
};

const LoginForm = ({ email, setEmail, password, setPassword }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive"
      });
      return;
    }

    try {
      await resetPassword(email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions."
      });
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Password reset failed",
        description: err.message || "Unable to send password reset email. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back to VerifyNews!"
      });
    } catch (error: unknown) {
      const err = error as Error;
      let message = err.message || "Login failed. Please check your credentials.";
      
      // Make error messages more user-friendly
      if (message.includes('Invalid') || message.includes('password')) {
        message = "Invalid email or password. Please try again.";
      } else if (message.includes('not configured')) {
        message = "Authentication service is not available. Please try again later.";
      }
      
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="you@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <button 
            type="button" 
            onClick={handleForgotPassword}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <Input 
          id="password" 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      
      <Button type="submit" className="w-full h-11" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Signing in...</span>
          </div>
        ) : (
          <span>Sign in</span>
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
