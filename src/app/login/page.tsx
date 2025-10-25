
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth.tsx';


export default function LoginPage() {
  const { user } = useAuth(); // useAuth handles redirection if already logged in
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, the AuthProvider will detect the state change and redirect automatically.
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
         setError(
          <>
            Incorrect email or password. Need an account?{' '}
            <Link href="/signup" className="font-bold underline">
              Sign Up
            </Link>
            .
          </>
        );
      }
      else {
        toast({
            variant: 'destructive',
            title: 'An Error Occurred',
            description: error.message,
        });
      }
      setIsLoading(false);
    } 
  };
  
  // The AuthProvider will show a loader and handle redirects,
  // so we don't need a separate loading state here.
  if (user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
             <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold tracking-tight">Admin Access</CardTitle>
          <CardDescription>Enter your credentials to access the panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                }}
                placeholder="admin@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                      setPassword(e.target.value)
                      setError(null)
                  }}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="mt-2 text-right">
                <Link href="/forgot-password" className="text-sm underline hover:text-primary">
                    Forgot Password?
                </Link>
              </div>
            </div>
            
            {error && (
              <CardDescription className="text-center text-destructive">
                {error}
              </CardDescription>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !password || !email}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Verifying...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="underline">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
