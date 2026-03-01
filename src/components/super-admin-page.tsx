'use client';

import React, { useState, useEffect, useTransition, useCallback, use } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Building, Link as LinkIcon, Loader2, Copy, Check } from 'lucide-react';
import type { Organization } from '@/lib/definitions';
import {
  getPlatformAveragesAction,
  getAllOrganizations,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import CreateOrgForm from './create-org-form';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface PlatformStats {
  avgDrivers: number;
  avgMembers: number;
  totalOrgs: number;
  _count: {
    drivers: number;
    members: number;
    vehicles: number;
  };
}


export default function SuperAdminClientPage({
  initialOrganizations,
}: {
  initialOrganizations: Organization[];
}) {
  const [organizations, setOrganizations] =
    useState<Organization[]>(initialOrganizations);

  const [stats, setStats] = useState<PlatformStats | null>(null);



  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getPlatformAveragesAction();
        if (result.success && result.data) {
          setStats(result.data as PlatformStats);
        } else {
          setStats(null);
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
        setStats(null);
      }
    }
    loadStats();
  }, []);

  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchOrganizations = async () => {
    setLoading(true);
    startTransition(async () => {
      try {
        const orgs = await getAllOrganizations();
        setOrganizations(orgs);
      } catch (error: any) {
        console.error('Failed to fetch organizations:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load organizations',
          description:
            'There was a problem fetching the list of organizations. Please refresh the page.',
        });
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <main className="flex flex-col w-full justify-left items-center gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex w-full items-center flex-col justify-center md:flex-row sm:flex-row gap-4 mb-4 px-4">
        <div className="px-4 py-4 bg-[#fff] w-full md:w-full text-dark rounded-md shadow-md">
        <div className="max-w-sm bg-[#E6F4F1] rounded-md p-2 mb-2">
          <p className="text-sm font-bold text-[#03624D]">Number of Organization</p>
          </div>
          <p className="text-5xl font-bold">{organizations.length}</p>
        </div>

        <div className="px-4 py-4 bg-[#fff] sm:w-full text-dark rounded-md shadow-md">
        <div className="max-w-sm bg-[#E6F4F1] rounded-md p-2 mb-2">
          <p className="text-sm font-bold text-[#03624D]">Average Drivers per Organization</p>
          </div>
          <p className="text-5xl font-bold">{ stats?.avgDrivers || 0 }</p>
        </div>

        <div className="px-4 py-4 bg-[#fff] sm:w-full text-dark rounded-md shadow-md">
        <div className="max-w-sm bg-[#E6F4F1] rounded-md p-2 mb-2">
          <p className="text-sm font-bold text-[#03624D]">Average Inspection Officers per Organization</p>
          </div>
          <p className="text-5xl font-bold">{ stats?.avgMembers || 0 }</p>
        </div>
        
      </div>
      <div className="mx-4 w-full gap-8">
        <CreateOrgForm onOrgCreated={() => fetchOrganizations()} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building /> Existing Organizations
            </CardTitle>
            <CardDescription>
              View all organizations currently in the system.
            </CardDescription>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Number of Drivers</TableHead>
                  <TableHead>Number of Inspection Officers</TableHead>
                  <TableHead>Number of Vehicles</TableHead>
                  <TableHead>Created at</TableHead>
                </TableRow>
              </TableHeader>
              
                {loading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  
                  organizations.length > 0 ? (
                    organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>{org.name}</TableCell>
                        <TableCell>{org.slug}</TableCell>
                        <TableCell>{org._count.drivers}</TableCell>
                        <TableCell>{org._count.members}</TableCell>
                        <TableCell>{org._count.vehicles}</TableCell>
                        <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <p className="text-muted-foreground p-4 text-center">
                      No organizations created yet.
                    </p>
                  )
                )}
              
            </Table>
            
          </CardHeader>
          
        </Card>
      </div>
    </main>
  );
}
