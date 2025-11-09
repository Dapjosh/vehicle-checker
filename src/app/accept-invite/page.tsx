import { Suspense } from 'react';
import AcceptInviteClient from './AcceptInviteClient';
import { Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AcceptInviteClient />
    </Suspense>
  );
}
