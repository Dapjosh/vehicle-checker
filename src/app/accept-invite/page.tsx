'use client';

import { useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { redirectToSignIn } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ticket = searchParams.get('__clerk_ticket');

    // If no ticket, this isn't an invite flow. Go home.
    if (!ticket) {
      router.push('/');
      return;
    }
    if (!isSignedIn) {
      redirectToSignIn({
        afterSignInUrl: `/accept-invite?__clerk_ticket=${ticket}`,
        afterSignUpUrl: `/accept-invite?__clerk_ticket=${ticket}`,
      });
    } else {
      // If they ARE signed in, Clerk automatically processes the ticket
      // just by virtue of visiting this page with the ticket in the URL.
      // We just wait a moment and then redirect to the dashboard.
      // The dashboard's /set-org logic will handle the rest.
      const timer = setTimeout(() => {
        router.push('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, searchParams, redirectToSignIn, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-200 p-4">
      <div className="flex-col space-y-4 justify-center items-center shadow-sm bg-white rounded-md p-4 max-w-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-black">
          {isSignedIn
            ? 'Finalizing invitation...'
            : 'Redirecting to secure sign-in...'}
        </p>
      </div>
    </div>
  );
}
