
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';

// Import newly created components
import WelcomeHeader from '@/components/auth/WelcomeHeader';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import SocialLogin from '@/components/auth/SocialLogin';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 flex items-center justify-center">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-md mx-auto glass-card p-8 animate-scale-in">
            <WelcomeHeader />

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
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
        </div>
      </main>
      <footer className="py-6 border-t border-foreground/5">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-foreground/40">
          VerifyNews &copy; {new Date().getFullYear()} — A tool for truth in the digital age
        </div>
      </footer>
    </div>
  );
};

export default Login;
