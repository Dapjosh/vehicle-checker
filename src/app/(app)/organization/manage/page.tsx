import React from 'react';

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/app-header';
import ManageOrganizationClientPage from '@/components/manage-organization-page';

export default async function ManageOrganization() {
  const { userId, orgId, orgRole } = await auth();

  const client = await clerkClient();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
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

  const isSuperAdmin = user?.publicMetadata?.role === 'super_admin';

  if (!isSuperAdmin && (!orgId || !orgRole)) {
    redirect('/wait-list');
  }

  return (
    <div className="flex flex-col">
      
      <ManageOrganizationClientPage orgId={orgId} />
    </div>
  );
}
