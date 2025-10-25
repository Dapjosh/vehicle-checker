
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from '@/lib/firebase';
import { claimInvitationToken, verifyInvitationToken } from '@/app/actions';

function SignupComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [token, setToken] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const signupToken = searchParams.get('token');
    if (!signupToken) {
        setError("A valid invitation token is required to sign up.");
        setIsLoading(false);
        return;
    }
    
    const verifyToken = async () => {
        const result = await verifyInvitationToken(signupToken);
        if (result.success && result.email) {
            setToken(signupToken);
            setInvitedEmail(result.email);
            setEmail(result.email); // Pre-fill the email field
        } else {
            setError(result.error || 'There was a problem verifying your invitation. Please try the link again.');
        }
        setIsLoading(false);
    }
    verifyToken();

  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        setError("The invitation token is missing. Please use the link provided in your invitation.");
        return;
    };

    if (email.toLowerCase() !== invitedEmail.toLowerCase()) {
        setError('You must sign up with the email address that was invited.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const claimResult = await claimInvitationToken(token, uid, email);

      if (!claimResult.success) {
        setError(claimResult.error || 'Could not link your account to the organization. Please contact support.');
        // If claiming fails, we should sign the user out to prevent an orphaned account.
        await signOut(auth); 
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Account Created',
        description: "Welcome! You've successfully joined your organization.",
      });
      router.push('/');
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email address is already in use. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The password must be at least 6 characters long.';
      } else {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
      });
      // Don't set loading to false here, as we want the button to remain disabled after a failed attempt
      // until the user changes something.
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Verifying invitation...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <>
          <CardHeader className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="mt-4 text-2xl font-bold tracking-tight">Sign Up Error</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-center text-destructive mb-4">{error}</p>
              <Button asChild className="w-full">
                  <Link href="/login">Return to Login</Link>
              </Button>
          </CardContent>
        </>
      )
    }

    return (
      <>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
             <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold tracking-tight">Create Your Account</CardTitle>
          <CardDescription>You've been invited to join! Complete your account setup for <span className="font-bold">{invitedEmail}</span>.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="cursor-not-allowed bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password (min. 6 characters)"
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !password}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating Account...' : 'Complete Sign Up'}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        {renderContent()}
      </Card>
    </div>
  );
}


export default function SignupPage() {
    return (
        <Suspense fallback={
             <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SignupComponent />
        </Suspense>
    )
}