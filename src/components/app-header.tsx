
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, FileText, Shield, LogOut, Wrench, Settings, Truck, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

function NavLinks({ user, isMobile = false }: { user: NonNullable<ReturnType<typeof useAuth>['user']>, isMobile?: boolean }) {
    const commonButtonProps = isMobile ? { variant: "ghost", className: "justify-start text-lg py-4" } as const : { variant: "outline" } as const;
    const LinkComponent = isMobile ? SheetClose : Link;

    return (
        <>
            <Button {...commonButtonProps} asChild>
                <LinkComponent href="/reports">
                    <FileText className="mr-2 h-4 w-4" />
                    View Reports
                </LinkComponent>
            </Button>

            {(user.role === 'member' || user.role === 'super_admin') && (
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

            {user.role === 'super_admin' && (
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
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) {
        return null;
    }

    return (
         <header className={cn("sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6", className)}>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={()=> router.back()}>
                    <Wrench className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold text-primary">FleetCheckr</h1>
                </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden items-center gap-2 md:flex">
                <NavLinks user={user} />
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
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={logout}>
                                <LogOut className="h-4 w-4" />
                                <span className="sr-only">Logout</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Logout</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
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
                                <Wrench className="h-6 w-6 text-primary" />
                                <h2 className="text-xl font-bold text-primary">FleetCheckr</h2>
                            </div>
                            <nav className="flex flex-col gap-4">
                                <NavLinks user={user} isMobile={true} />
                            </nav>
                            <div className="mt-auto flex flex-col gap-4">
                                <ModeToggle />
                                <Button variant="outline" onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}