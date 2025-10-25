
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, FileText, Shield, LogOut, Wrench, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function AppHeader({ className }: { className?: string }) {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) {
        return null;
    }

    return (
         <header className={cn("sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6", className)}>
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Back</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Back</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-2">
                    <Wrench className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold text-primary">VehicleCheck</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
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

                <Button variant="outline" asChild>
                    <Link href="/reports">
                        <FileText className="mr-2 h-4 w-4" />
                        View Reports
                    </Link>
                </Button>

                {user.role === 'member' && (
                    <Button variant="outline" asChild>
                    <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Checklist
                    </Link>
                    </Button>
                )}

                {user.role === 'super_admin' && (
                    <Button variant="outline" asChild>
                    <Link href="/super-admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Super Admin
                    </Link>
                    </Button>
                )}
                
                <TooltipProvider>
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
        </header>
    );
}
