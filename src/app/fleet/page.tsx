
"use client";

import FleetManager from '@/components/fleet-manager';
import { useAuth } from '@/hooks/use-auth.tsx';
import AppHeader from '@/components/app-header';

export default function FleetPage() {
  const { user } = useAuth();
  
  if (!user || (user.role !== 'member' && user.role !== 'super_admin')) {
    return null; 
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Fleet Management</h2>
                <p className="text-muted-foreground">
                Manage your organization's drivers and vehicles.
                </p>
            </div>
            <FleetManager orgId={user.orgId} />
        </div>
      </main>
    </div>
  );
}