import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getAllOrganizations } from '@/app/actions';
import AppHeader from '@/components/app-header';
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
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <SuperAdminClientPage initialOrganizations={initialOrganizations} />
    </div>
  );
}
