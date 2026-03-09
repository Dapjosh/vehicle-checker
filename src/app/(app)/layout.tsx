import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgSlug } = await auth();
  const user = await currentUser();

  const orgName = orgSlug
    ? orgSlug.replace(/-/g, ' ').toUpperCase()
    : 'No Organization';

  if (!userId || !user) {
    redirect('/sign-in');
  }

  const isSuperAdmin = user.publicMetadata?.role === 'super_admin';

  return (
    <div className='flex min-h-screen w-full bg-background'>
      
      <AppSidebar isSuperAdmin={isSuperAdmin} />

      
      <div className='flex flex-col flex-1 min-w-0'>
       
        <header className='flex h-16 items-center gap-4 border-b bg-background px-6 justify-end'>
          <h3 className='text-xs bg-gray-100 rounded-md p-2 font-semibold text-primary uppercase tracking-wide'>
            {orgName}
          </h3>
          <UserButton afterSignOutUrl='/' />
        </header>

        {/* Page Content */}
        <main className='flex-1 p-6 md:p-8 overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
}
