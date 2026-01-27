import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  const isSuperAdmin = user.publicMetadata?.role === 'super_admin';

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar - Takes up fixed width on desktop */}
      <AppSidebar isSuperAdmin={isSuperAdmin} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header - Only contains Profile Icon as requested */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6 justify-end">
          <UserButton afterSignOutUrl="/" />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}