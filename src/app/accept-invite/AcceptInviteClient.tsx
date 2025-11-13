'use client';

import { useEffect, useState } from 'react';
import { useSignIn, useSignUp, useUser, useClerk } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { redirectToSignIn, redirectToSignUp } = useClerk();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    const ticket = searchParams.get('__clerk_ticket');
    const status = searchParams.get('__clerk_status');

    const redirectUrl = `/sign-in?__clerk_ticket=${ticket}`;

    // If no ticket, this isn't an invite flow. Go home.
    if (!ticket) {
      router.push('/');
      return;
    }

    if (status === 'sign_up') {
      redirectToSignUp({ redirectUrl });
    } else {
      redirectToSignIn({ redirectUrl });
    }
  }, [
    searchParams,
    isLoaded,
    router,
    redirectToSignIn,
    redirectToSignUp,
    isSignedIn,
  ]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-200 p-4">
      <div className="flex-col space-y-4 justify-center items-center shadow-sm bg-white rounded-md p-4 max-w-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-black">Finalizing invitation...</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
