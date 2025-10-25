
"use client";

import VehicleCheckForm from '@/components/vehicle-check-form';
import { useAuth } from '@/hooks/use-auth';
import AppHeader from '@/components/app-header';

export default function Home() {
  const { user } = useAuth();
  
  if (!user) {
    // AuthProvider handles redirection, so this is just a fallback.
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inspection Checklist</h2>
            <p className="text-muted-foreground">
              Complete the checklist below to save an inspection report for your vehicle.
            </p>
          </div>
          <div className="w-full">
            <VehicleCheckForm />
          </div>
        </div>
      </main>
    </div>
  );
}
