
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useFiles } from '@/context/FileContext';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const Auth: React.FC = () => {
  const { user } = useFiles();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  
  useEffect(() => {
    // If already logged in, redirect to home
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isResetMode) {
        // Reset password flow
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        
        if (error) throw error;
        
        toast.success('Password reset link sent', {
          description: 'Check your email for a link to reset your password'
        });
        setIsResetMode(false);
      } else if (authMode === 'sign-in') {
        // Sign in flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        toast.success('Signed in successfully');
        navigate('/');
      } else {
        // Sign up flow
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
            emailRedirectTo: `${window.location.origin}/auth?verification=true`,
          }
        });
        
        if (error) throw error;
        
        toast.success('Registration successful', {
          description: 'Please check your email to verify your account'
        });
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check for reset or verification status in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === 'true') {
      toast.info('You can now reset your password');
    }
    if (params.get('verification') === 'true') {
      toast.info('Email verification successful', {
        description: 'You can now sign in with your account'
      });
    }
  }, [location]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-md w-full mx-auto px-4 md:px-6 py-12">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isResetMode ? 'Reset Password' : authMode === 'sign-in' ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isResetMode 
                ? 'Enter your email to receive a password reset link' 
                : authMode === 'sign-in' 
                  ? 'Sign in to your account to access your stories'
                  : 'Create a new account to save and share your stories'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResetMode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Send Reset Link
                </Button>
                
                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    type="button" 
                    className="text-sm"
                    onClick={() => setIsResetMode(false)}
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Sign In
                  </Button>
                </div>
              </form>
            ) : (
              <Tabs
                value={authMode}
                onValueChange={(value) => setAuthMode(value as 'sign-in' | 'sign-up')}
                className="space-y-4"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                  <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sign-in" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sign-in-email">Email</Label>
                      <Input
                        id="sign-in-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="sign-in-password">Password</Label>
                      </div>
                      <div className="relative">
                        <Input
                          id="sign-in-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={togglePasswordVisibility}
                          className="absolute right-0 top-0 h-full"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                      Sign In
                    </Button>
                    
                    <div className="text-center">
                      <Button 
                        variant="ghost" 
                        type="button" 
                        className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsResetMode(true)}
                      >
                        Forgot your password?
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="sign-up" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sign-up-email">Email</Label>
                      <Input
                        id="sign-up-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sign-up-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="sign-up-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={togglePasswordVisibility}
                          className="absolute right-0 top-0 h-full"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                    
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
};

export default Auth;
