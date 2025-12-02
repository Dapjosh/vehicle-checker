'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, User, Users, UserPlus, Mail } from 'lucide-react';

import { getOrgUsers, inviteUserToOrg } from '@/app/actions';
import type { UserData } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth } from '@clerk/nextjs';
export default function UserManagement({ orgId }: { orgId: string }) {
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, startInviteTransition] = useTransition();

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const orgUsers = await getOrgUsers(orgId);
      setUsers(orgUsers);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) return;

    startInviteTransition(async () => {
      const result = await inviteUserToOrg(orgId, inviteEmail);

      if (result.success) {
        toast({
          title: 'Invitation Sent',
          description: `An email has been sent to ${inviteEmail}.`,
        });
        setInviteEmail('');
        setIsInviteOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invitation Failed',
          description: result.error,
        });
      }
    });
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div></div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
                <DialogDescription>
                  Enter the email address of the person you want to invite. They
                  will receive an email to sign up.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleInvite}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      className="col-span-3"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : users.length > 0 ? (
              users.map((userData) => (
                <div
                  key={userData.uid}
                  className="flex items-center justify-between rounded-md border p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      {userData.photoURL && (
                        <AvatarImage
                          src={userData.photoURL}
                          alt={userData.email || ''}
                        />
                      )}
                      <AvatarFallback>
                        {getInitials(userData.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {userData.displayName || userData.email}
                      </p>
                      <p className="text-sm text-gray-500">{userData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="mr-1 h-4 w-4" />
                    {userData.role === 'org:admin' ? 'Admin' : 'Member'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">
                  No users found for this organization.
                </p>
                <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
                  Invite your first member
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
