import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing-page';

export default async function RootPage() {
  const { userId } = await auth();

  // If the user is logged in, send them straight to the new dashboard route
  if (userId) {
    redirect('/dashboard');
  }

  // If not logged in, show the public landing page
  return <LandingPage />;
}