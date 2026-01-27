import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

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

  let initialReports;
  try {
    // We wrap this in a try...catch so the page doesn't crash
    // if the database call fails for any reason.

    // This function is returning a mixed type, so we must check it.
    const reportResult = await getReports();

    if (Array.isArray(reportResult)) {
      initialReports = reportResult;
    } else if (
      reportResult &&
      typeof reportResult === 'object' &&
      'data' in reportResult
    ) {
      initialReports = reportResult.data || [];
    } else {
      console.warn('Unexpected data shape from getReports()', reportResult);
      initialReports = [];
    }
  } catch (error: any) {
    console.error('Failed to fetch initial reports:', error);

    initialReports = [];
  }
  return (
    <div className="flex flex-col">
    
      <ReportsPageClient initialReports={initialReports} />
    </div>
  );
}
