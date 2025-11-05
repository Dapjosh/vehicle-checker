import { auth, currentUser } from '@clerk/nextjs/server';
import VehicleCheckForm from '@/components/vehicle-check-form';
import AppHeader from '@/components/app-header';
import { redirect } from 'next/navigation';
import { getChecklistAction, getDrivers, getVehicles } from '@/app/actions';
import { DataErrorCard } from '@/components/ui/data-error-card';

export default async function Home() {
  const { userId, orgId, orgRole } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/login');
  }

  const isSuperAdmin = user?.publicMetadata?.role === 'super_admin';

  if (!isSuperAdmin && (!orgId || !orgRole)) {
    redirect('/wait-list');
  }

  let checklistResult, drivers, vehicles;
  try {
    [checklistResult, drivers, vehicles] = await Promise.all([
      getChecklistAction(),
      getDrivers(),
      getVehicles(),
    ]);
  } catch (e: any) {
    // Handle generic fetch error
    return <DataErrorCard error={e.message} />;
  }

  // 4. Check for checklist-specific error
  if (!checklistResult.success || !checklistResult.data) {
    return <DataErrorCard error={checklistResult.error} />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Inspection Checklist
            </h2>
            <p className="text-muted-foreground">
              Complete the checklist below to save an inspection report for your
              vehicle.
            </p>
          </div>
          <div className="w-full">
            <VehicleCheckForm
              categories={checklistResult.data}
              drivers={drivers}
              vehicles={vehicles}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
