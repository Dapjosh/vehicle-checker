import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ChecklistEditor from '@/components/checklist-editor';

export default async function AdminPage() {
  const user = await currentUser();
  const { userId, orgId, orgRole } = await auth();
  const client = await clerkClient();

  // The AuthProvider handles loading and redirection for non-admins.
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

  return (
    <div className="flex flex-col">
      
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-4xl gap-8">
          <ChecklistEditor />
        </div>
      </main>
    </div>
  );
}
