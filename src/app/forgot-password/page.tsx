
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailQuestion } from 'lucide-react';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/user-not-found') {
            description = "No account found with this email address."
        } else {
            description = error.message
        }

        toast({
            variant: 'destructive',
            title: 'Request Failed',
            description: description,
        });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
             <MailQuestion className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
          <CardDescription>
            {sent 
                ? "If an account with that email exists, a password reset link has been sent."
                : "Enter your email to receive a password reset link."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
            {sent ? (
                <div className="text-center">
                     <Button asChild className="w-full">
                        <Link href="/login">
                            Return to Sign In
                        </Link>
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                        disabled={isLoading}
                    />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || !email}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>
            )}
           <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <Link href="/login" className="underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
