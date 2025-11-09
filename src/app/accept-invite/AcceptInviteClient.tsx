'use client';

import { useEffect, useState } from 'react';
import { useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function acceptInvite() {
      const ticket = searchParams.get('__clerk_ticket');
      const status = searchParams.get('__clerk_status');

      console.log('AcceptInviteClient: ticket=', ticket);

      // If no ticket, this isn't an invite flow. Go home.
      if (!ticket) {
        router.push('/');
        return;
      }

      try {
        // If already complete, just go home
        if (status === 'complete') {
          router.push('/');
          return;
        }

        // If not signed in, redeem the ticket via sign-in or sign-up
        if (!isSignedIn) {
          if (status === 'sign_in') {
            // Existing user: create sign-in with ticket
            const result = await signIn?.create({ strategy: 'ticket', ticket });
            if (result?.status === 'complete') {
              router.push('/');
            }
          } else {
            // New user: create sign-up with ticket
            const result = await signUp?.create({ strategy: 'ticket', ticket });
            if (result?.status === 'complete') {
              router.push('/');
            }
          }
        } else {
          // Already signed in: just redeem the ticket and go home
          await signIn?.create({ strategy: 'ticket', ticket });
          router.push('/');
        }
      } catch (e: any) {
        console.error('Failed to accept invitation:', e);
        setError(
          e?.errors?.[0]?.message ||
            e?.message ||
            'Failed to accept invitation.'
        );
      }
    }

    acceptInvite();
  }, [searchParams, router, signIn, signUp, isSignedIn]);

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
