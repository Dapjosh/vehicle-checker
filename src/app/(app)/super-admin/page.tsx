import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getAllOrganizations } from '@/app/actions';
import SuperAdminClientPage from '@/components/super-admin-page';
export default async function SuperAdminPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  if (user?.publicMetadata?.role !== 'super_admin') {
    redirect('/admin');
  }

  const initialOrganizations = await getAllOrganizations();

  return (
    <div className="flex flex-col justify-left items-center min-h-screen">

      <SuperAdminClientPage initialOrganizations={initialOrganizations} />
    </div>
  );
}
