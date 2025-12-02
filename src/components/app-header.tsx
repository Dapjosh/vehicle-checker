'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  FileText,
  Shield,
  LogOut,
  Wrench,
  Settings,
  Truck,
  Menu,
  PlusCircle,
  BriefcaseBusiness,
  UserSquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth, useUser, useOrganization } from '@clerk/nextjs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';

interface NavData {
  orgRole: string | null;
  globalRole: string | undefined;
}
function NavLinks({
  navData,
  isMobile = false,
}: {
  navData: NavData;
  isMobile?: boolean;
}) {
  const commonButtonProps = isMobile
    ? ({ variant: 'ghost', className: 'justify-start text-lg py-4' } as const)
    : ({ variant: 'outline' } as const);
  const LinkComponent = isMobile ? SheetClose : Link;

  const isSuperAdmin = navData.globalRole === 'super_admin';
  const isOrgMember = navData.orgRole === 'org:member';

  const isOrgAdmin = navData.orgRole === 'org:admin';

  return (
    <>
      {navData.orgRole && (isSuperAdmin || isOrgAdmin) && (
        <Button {...commonButtonProps} asChild>
          <LinkComponent href="/reports">
            <FileText className="mr-2 h-4 w-4" />
            View Reports
          </LinkComponent>
        </Button>
      )}

      {(isOrgAdmin || isOrgMember) && (
        <Button {...commonButtonProps} asChild>
          <LinkComponent href="/reports/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add new Report
          </LinkComponent>
        </Button>
      )}

      {(isOrgAdmin || isSuperAdmin) && (
        <>
          <Button {...commonButtonProps} asChild>
            <LinkComponent href="/fleet">
              <Truck className="mr-2 h-4 w-4" />
              Manage Fleet
            </LinkComponent>
          </Button>
          <Button {...commonButtonProps} asChild>
            <LinkComponent href="/admin">
              <Settings className="mr-2 h-4 w-4" />
              Manage Checklist
            </LinkComponent>
          </Button>
        </>
      )}

      {isSuperAdmin && (
        <Button {...commonButtonProps} asChild>
          <LinkComponent href="/super-admin">
            <Shield className="mr-2 h-4 w-4" />
            Super Admin
          </LinkComponent>
        </Button>
      )}
    </>
  );
}

export default function AppHeader({ className }: { className?: string }) {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, orgRole } = useAuth();
  const { organization } = useOrganization();
  const { isLoaded: isUserLoaded, user } = useUser();

  const isOrgAdmin = orgRole === 'org:admin';

  const orgName = organization ? organization.name : 'No Organization';

  if (!isAuthLoaded || !isUserLoaded) {
    // Render a minimal header shell while loading
    return (
      <header
        className={cn(
          'sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">FleetCheckr</h1>
        </div>
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </header>
    );
  }

  const navData: NavData = {
    orgRole,
    globalRole: user?.publicMetadata?.role as string | undefined,
  };
  return (
    <div>
      <header
        className={cn(
          'sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Wrench className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">FleetCheckr</h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <NavLinks navData={navData} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SignedIn>
                  <UserButton afterSignOutUrl="/sign-in" />
                </SignedIn>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>

          {isOrgAdmin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open navigation menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-blue-500 focus:text-white hover:bg-blue-500 hover:text-white"
                  >
                    <Link href="/user/manage">
                      <UserSquare className="mr-2 h-4 w-4" />
                      Manage Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-blue-500 focus:text-white hover:bg-blue-500 hover:text-white"
                  >
                    <Link href="/organization/manage">
                      <BriefcaseBusiness className="mr-2 h-4 w-4" />
                      Manage Organization
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <ModeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" asChild>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span className="sr-only">Home</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Home</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-full flex-col py-8">
                <div className="mb-8 flex items-center gap-2">
                  <Link href="/">
                    <h2 className="text-xl font-bold text-primary">
                      FleetCheckr
                    </h2>
                  </Link>
                </div>
                <nav className="flex flex-col gap-4">
                  <NavLinks navData={navData} isMobile={true} />
                </nav>
                <div className="mt-auto flex flex-col gap-4">
                  <ModeToggle />
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      {orgName && (
        <div className="flex items-center justify-center h-16 border-b bg-background px-4 md:px-6">
          <BriefcaseBusiness className="mr-2 h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-black">{orgName}</h1>
        </div>
      )}
    </div>
  );
}
