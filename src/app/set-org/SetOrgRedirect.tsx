'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function SetOrgPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActive } = useClerk();

  const orgId = searchParams.get('orgId');

  useEffect(() => {
    if (!orgId || !setActive) {
      // If no orgId in URL or clerk isn't ready, go home
      router.push('/');
      return;
    }

    setActive({ organization: orgId })
      .then(() => {
        router.push('/');
      })
      .catch((err) => {
        console.error('Error setting active organization:', err);

        router.push('/');
      });
  }, [orgId, setActive, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
