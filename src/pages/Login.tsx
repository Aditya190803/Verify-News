
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';

import WelcomeHeader from '@/components/auth/WelcomeHeader';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import SocialLogin from '@/components/auth/SocialLogin';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <WelcomeHeader />

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Sign in
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Create account
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm 
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                />
              </TabsContent>
              
              <TabsContent value="signup">
                <SignupForm 
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                />
              </TabsContent>
            </Tabs>

            <SocialLogin />
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </main>
      
      <footer className="py-6 border-t border-border/50 bg-background">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">← Back to home</Link>
        </div>
      </footer>
    </div>
  );
};

export default Login;
