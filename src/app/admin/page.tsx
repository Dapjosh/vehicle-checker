
"use client";

import ChecklistEditor from '@/components/checklist-editor';
import { useAuth } from '@/hooks/use-auth.tsx';
import AppHeader from '@/components/app-header';

export default function AdminPage() {
  const { user } = useAuth();
  
  // The AuthProvider handles loading and redirection for non-admins.
  if (!user || user.role !== 'member') {
    return null; 
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-8">
          <ChecklistEditor orgId={user.orgId} />
        </div>
      </main>
    </div>
  );
}
