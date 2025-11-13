import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import VehicleCheckForm from '@/components/vehicle-check-form';
import AppHeader from '@/components/app-header';
import { redirect } from 'next/navigation';
import { getChecklistAction, getDrivers, getVehicles } from '@/app/actions';
import { DataErrorCard } from '@/components/ui/data-error-card';
import { NextResponse } from 'next/server';

export default async function Home() {
  const { userId, orgId, orgRole } = await auth();
  const client = await clerkClient();
  const user = await currentUser();

  const isSuperAdmin = user?.publicMetadata?.role === 'super_admin';

  if (isSuperAdmin) {
    redirect('/super-admin');
  }

  if (!orgId) {
    const memberships = await client.users.getOrganizationMembershipList({
      userId: userId!,
    });

    if (memberships.data.length === 0) {
      redirect('/wait-list');
    }
    const firstOrgId = memberships.data[0].organization.id;

    redirect(`/set-org?orgId=${firstOrgId}`);
  }
  if (!isSuperAdmin && (!orgId || !orgRole)) {
    redirect('/wait-list');
  }

  let pageContent: React.ReactNode;

  let checklistResult, drivers, vehicles;
  try {
    [checklistResult, drivers, vehicles] = await Promise.all([
      getChecklistAction(),
      getDrivers(),
      getVehicles(),
    ]);
    if (!checklistResult.success || !checklistResult.data) {
      pageContent = <DataErrorCard error={checklistResult.error} />;
    } else {
      pageContent = (
        <>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Inspection Checklist
            </h2>
            <p className="text-muted-foreground">
              Complete the checklist below to save an inspection report.
            </p>
          </div>
          <div className="w-full">
            <VehicleCheckForm
              categories={checklistResult.data}
              drivers={drivers}
              vehicles={vehicles}
            />
          </div>
        </>
      );
    }
  } catch (e: any) {
    // Handle generic fetch error
    pageContent = <DataErrorCard error={e.message} />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-4">{pageContent}</div>
      </main>
    </div>
  );
}
