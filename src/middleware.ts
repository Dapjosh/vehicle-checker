import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/organizations(.*)',
  '/admin(.*)',
  '/users(.*)',
  '/super-admin(.*)',
  '/fleet(.*)',
  '/reports(.*)',
  '/wait-list(.*)',
  '/set-org(.*)',
  '/dashboard(.*)',
]);

const isPaidRoute = createRouteMatcher([
  '/fleet(.*)',
  '/reports(.*)',
  '/dashboard(.*)',
  '/admin(.*)',
  '/organizations(.*)',
]);

// const isPublicRoute = createRouteMatcher(['/signup(.*)', '/login(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();

    const { orgId, sessionClaims } = await auth();

    const orgMetadata = sessionClaims?.org_metadata as
      | Record<string, any>
      | undefined;

    const activePlan = orgMetadata?.plan as string | undefined;

    const isPaid = activePlan === 'monthly' || activePlan === 'annual';

    if (orgId && !isPaid) {
      const pricingUrl = new URL('/pricing', req.url);

      pricingUrl.searchParams.set('reason', 'subscription_required');

      return NextResponse.redirect(pricingUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
