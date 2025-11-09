'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const ticket = searchParams.get('__clerk_ticket');

  const afterSignInUrl = ticket ? `/?__clerk_ticket=${ticket}` : '/';
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-200 p-4">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        forceRedirectUrl={afterSignInUrl}
      />
    </div>
  );
}
