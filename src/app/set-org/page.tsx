import { Suspense } from 'react';
import SetOrgRedirect from './SetOrgRedirect';
import { Loader2 } from 'lucide-react';

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function SetOrgPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SetOrgRedirect />
    </Suspense>
  );
}
