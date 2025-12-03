
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

type SignupFormProps = {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
};

const SignupForm = ({ email, setEmail, password, setPassword }: SignupFormProps) => {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password should be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signup(email, password);
      toast({
        title: "Account created successfully",
        description: "Welcome to VerifyNews!"
      });
    } catch (error: unknown) {
      const err = error as Error;
      let message = err.message || "Failed to create account.";
      
      // Make error messages more user-friendly
      if (message.includes('already') || message.includes('exists')) {
        message = "This email is already registered. Try logging in instead.";
      } else if (message.includes('invalid') && message.toLowerCase().includes('email')) {
        message = "Please enter a valid email address.";
      } else if (message.includes('password') && message.includes('weak')) {
        message = "Your password is too weak. Please use a stronger password.";
      } else if (message.includes('not configured')) {
        message = "Authentication service is not available. Please try again later.";
      }
      
      toast({
        title: "Sign up failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
        <Input 
          id="signup-email" 
          type="email" 
          placeholder="you@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
        <Input 
          id="signup-password" 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
        <Input 
          id="confirm-password" 
          type="password" 
          placeholder="••••••••" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      
      <Button type="submit" className="w-full h-11" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Creating account...</span>
          </div>
        ) : (
          <span>Create account</span>
        )}
      </Button>
    </form>
  );
};

export default SignupForm;
