
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Users } from 'lucide-react';
import { getOrgUsers } from '@/lib/firestore';
import type { UserData } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth.tsx';

export default function UserManagement({ orgId }: { orgId: string }) {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const orgUsers = await getOrgUsers(orgId);
    setUsers(orgUsers);
    setLoadingUsers(false);
  }, [orgId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  if (!adminUser) return null;

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Organization User</CardTitle>
          <CardDescription>This is the primary user for your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length > 0 ? (
              users.map(user => (
                <div key={user.uid} className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      {user.photoURL && <AvatarImage src={user.photoURL} alt={user.email} />}
                      <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.displayName || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <User className="mr-1 h-4 w-4" />
                       Organization Member
                   </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No user found for this organization.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
