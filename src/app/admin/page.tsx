import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ChecklistEditor from '@/components/checklist-editor';

import AppHeader from '@/components/app-header';

export default async function AdminPage() {
  const { userId, orgId } = await auth();

  // The AuthProvider handles loading and redirection for non-admins.
  if (!userId) {
    redirect('/login');
  }

  if (!orgId) {
    redirect('/wait-list');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-8">
          <ChecklistEditor orgId={orgId} />
        </div>
      </main>
    </div>
  );
}
