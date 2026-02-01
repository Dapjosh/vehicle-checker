import FleetManager from '@/components/fleet-manager';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import AppHeader from '@/components/app-header';
import { redirect } from 'next/navigation';
import { getDrivers, getVehicles } from '@/app/actions';

export default async function FleetPage() {
  const user = await currentUser();
  const { userId, orgId, orgRole } = await auth();
  const client = await clerkClient();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  if (!orgId) {
    const memberships = await client.users.getOrganizationMembershipList({
      userId: userId,
    });

    if (memberships.data.length === 0) {
      redirect('/wait-list');
    }
    const firstOrgId = memberships.data[0].organization.id;

    redirect(`/set-org?orgId=${firstOrgId}`);
  }
  const isSuperAdmin = user.publicMetadata?.role === 'super_admin';
  const isOrgAdmin = orgRole === 'org:admin';

  if (!isSuperAdmin && !isOrgAdmin) {
    // If not, send them to the dashboard
    redirect('/');
  }

  let drivers: any[] = [];
  let vehicles: any[] = [];

  try {
    const [d, v] = await Promise.all([
      getDrivers(10),
      getVehicles(10)
    ]);
    drivers = d;
    vehicles = v;
  } catch (error) {
    console.error("Failed to load fleet data:", error);
    // If fetch fails, we pass empty arrays so the UI doesn't crash
  }

  
  return (
    <div className="flex flex-col">

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Fleet Management
            </h2>
            <p className="text-muted-foreground">
              Manage your organization's drivers and vehicles.
            </p>
          </div>
          <FleetManager initialDrivers={drivers} 
      initialVehicles={vehicles} orgId={orgId} />
        </div>
      </main>
    </div>
  );
}
