'use client';

import { useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const { handleRedirectCallback } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    handleRedirectCallback({
      afterSignInUrl: '/',
      afterSignUpUrl: '/',
    }).catch(() => {
      router.push('/');
    });
  }, [handleRedirectCallback, router]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-200 p-4">
      <div className="flex-col space-y-4 justify-center items-center shadow-sm bg-white rounded-md p-4 max-w-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Accepting invitation...</span>
      </div>
    </div>
  );
}
