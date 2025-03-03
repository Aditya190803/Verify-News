
import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
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
  const { login } = useAuth();
  const { toast } = useToast();
  
  const handleForgotPassword = () => {
    toast({
      title: "Password reset",
      description: "Password reset functionality will be implemented soon."
    });
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
    } catch (error: any) {
      let message = "Login failed. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many unsuccessful login attempts. Please try again later.";
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
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
          <Input 
            id="email" 
            type="email" 
            placeholder="your@email.com" 
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button 
            type="button" 
            onClick={handleForgotPassword}
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            className="pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Logging in...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </div>
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
