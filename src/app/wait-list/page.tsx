import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }
  return (
    // This will center the sign-up form on the page
    <div className="flex min-h-screen items-center justify-center bg-gray-200 p-4">
      <div className="flex-col space-y-4 justify-center items-center shadow-sm bg-white rounded-md p-4 max-w-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900">
          <img className="w-100" src="/pause-circle.svg" />
        </div>
        <h1 className="text-xl font-bold">Your account is awaiting approval</h1>
        <p>Please hold on while we get things sorted for you.</p>
      </div>
    </div>
  );
}
