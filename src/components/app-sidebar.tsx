'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Truck,
  CheckSquare,
  Users,
  Settings,
  Shield,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface SidebarProps {
  isSuperAdmin: boolean;
  className?: string;
}

export function AppSidebar({ isSuperAdmin, className }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'View Reports',
      href: '/reports',
      icon: FileText,
    },
    {
      label: 'New Inspection',
      href: '/reports/add', 
      icon: PlusCircle,
    },
    {
      label: 'Manage Fleet',
      href: '/fleet',
      icon: Truck,
    },
    {
      label: 'Checklist Config',
      href: '/admin', 
      icon: CheckSquare,
    },
    // Add User Management link if you have a route for it
    {
       label: 'Team Members',
       href: '/organization/manage', 
       icon: Users,
    },
  ];

  if (isSuperAdmin) {
    links.push({
      label: 'Super Admin',
      href: '/super-admin',
      icon: Shield,
    });
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-[#03624D]">
          <span>FleetCheckr</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-[#262626] hover:bg-[#E6F4F1]",
                  isActive 
                    ? "bg-[#E6F4F1] text-[#03624D] font-semibold" 
                    : "text-muted-foreground hover:bg-[#E6F4F1]"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4 bg-[#03624D]">
         <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all bg-transparent"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden border-r bg-gray-50/40 md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0", className)}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden absolute left-4 top-4 z-50">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}