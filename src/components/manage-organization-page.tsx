//create the mange organization component page
import React from 'react';
import UserManagement from './user-management';

export default function ManageOrganizationClientPage({
  orgId,
}: {
  orgId: string;
}) {
  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-2xl font-bold">Manage Organization</h1>
      <UserManagement orgId={orgId} />
    </div>
  );
}
