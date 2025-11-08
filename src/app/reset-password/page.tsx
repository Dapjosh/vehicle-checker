'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function ResetPasswordComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [oobCode, setOobCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code) {
      setError(
        'Invalid or missing password reset code. Please request a new one.'
      );
      setIsLoading(false);
      setIsVerifying(false);
      return;
    }
    setOobCode(code);

    // Verify the code is valid before showing the form
    const verifyCode = async () => {
      try {
        await verifyPasswordResetCode(auth, code);
        setIsVerifying(false);
      } catch (error: any) {
        if (error.code === 'auth/expired-action-code') {
          setError(
            'This password reset link has expired. Please request a new one.'
          );
        } else {
          setError('Invalid password reset link. Please request a new one.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    verifyCode();
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError(null);
    setIsLoading(true);

    if (!oobCode) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      toast({
        title: 'Password Reset Successful',
        description: 'You can now log in with your new password.',
      });
      setTimeout(() => router.push('/sign-in'), 3000);
    } catch (error: any) {
      if (error.code === 'auth/expired-action-code') {
        setError(
          'This password reset link has expired. Please request a new one.'
        );
      } else {
        setError(
          'An error occurred while resetting your password. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading || isVerifying) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Verifying your link...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-destructive mb-6">{error}</p>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a New Link</Link>
          </Button>
        </div>
      );
    }

    if (success) {
      return (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight mb-2">
            Password Reset!
          </CardTitle>
          <CardDescription>
            Your password has been successfully updated. Redirecting you to the
            login page...
          </CardDescription>
        </div>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>
        {error && (
          <CardDescription className="text-center text-destructive">
            {error}
          </CardDescription>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !newPassword || !confirmPassword}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Resetting...' : 'Set New Password'}
        </Button>
      </form>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          {!success && !error && !isVerifying && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mt-4 text-2xl font-bold tracking-tight">
                Reset Your Password
              </CardTitle>
              <CardDescription>
                Enter and confirm your new password below.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordComponent />
    </Suspense>
  );
}
