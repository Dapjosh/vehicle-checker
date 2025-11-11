import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import AppHeader from '@/components/app-header';
import ReportsPageClient from '@/components/report-page-client';
import { getReports } from '@/app/actions';

export default async function ReportsPage() {
  const { userId, orgId, orgRole } = await auth();
  const client = await clerkClient();
  const user = await currentUser();

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
  const isSuperAdmin = user?.publicMetadata?.role === 'super_admin';
  const isOrgAdmin = orgRole === 'org:admin';

  if (!isSuperAdmin && !isOrgAdmin) {
    // If not, send them to the dashboard
    redirect('/');
  }

  const initialReports = await getReports();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <ReportsPageClient initialReports={initialReports} />
    </div>
  );
}
