//create the manage organization component page

'use client';

import React from 'react';
import UserManagement from '@/components/user-management';

export default function ManageOrganizationClientPage({
  orgId,
}: {
  orgId: string;
}) {
  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-2xl font-bold">Manage Organization</h1>
      <p className="text-sm text-muted dark:text-white">
        Manage members and add new ones to organization
      </p>
      <UserManagement orgId={orgId} />
    </div>
  );
}
