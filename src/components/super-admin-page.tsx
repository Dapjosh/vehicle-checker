'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  createOrganizationAndInvite,
  getAllOrganizations,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
// import { sendOrganizationInviteEmail } from '@/lib/email';

function CreateOrgForm({ onOrgCreated }: { onOrgCreated: () => void }) {
  const [orgName, setOrgName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  // const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // setGeneratedLink('');
    setIsCopied(false);

    startTransition(async () => {
      const result = await createOrganizationAndInvite(orgName, userEmail);
      if (result.success) {
        // setGeneratedLink(result.signupLink);
        setInviteSent(true);
        onOrgCreated();
        toast({
          title: 'Invitation Email Sent',
          description: 'The invitation email has been sent successfully.',
        });
        // try {
        //   const emailResult = await sendOrganizationInviteEmail(
        //     userEmail,
        //     orgName
        //     // result.signupLink
        //   );
        //   if (emailResult.success) {
        //     toast({
        //       title: 'Invitation Email Sent',
        //       description: 'The invitation email has been sent successfully.',
        //     });
        //   } else {
        //     toast({
        //       variant: 'destructive',
        //       title: 'Failed to Send Invitation Email',
        //       description: emailResult.error,
        //     });
        //   }
        // } catch (emailError: any) {
        //   toast({
        //     variant: 'destructive',
        //     title: 'Failed to Send Invitation Email',
        //     description: `Link was generated but the email failed, ${emailError.message}`,
        //   });
        // }
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Generate Link',
          description: result.message,
        });
      }
    });
  };

  // const handleCopyToClipboard = () => {
  //   navigator.clipboard.writeText(generatedLink).then(() => {
  //     setIsCopied(true);
  //     setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  //   });
  // };

  const handleResetForm = () => {
    setOrgName('');
    setUserEmail('');
    // setGeneratedLink('');
    setIsCopied(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building /> Onboard New Organization
        </CardTitle>
        <CardDescription>
          Generate an invitation link for a new organization and its first user.
          The organization will be created once the user signs up.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="New Company Inc."
              required
              // disabled={isPending || !!generatedLink}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userEmail">User's Email</Label>
            <Input
              id="userEmail"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@newco.com"
              required
              // disabled={isPending || !!generatedLink}
            />
          </div>

          {/* {generatedLink && (
            <div className="space-y-2 pt-4">
              <Label htmlFor="signupLink">Share this Signup Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="signupLink"
                  readOnly
                  value={generatedLink}
                  className="bg-muted/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyToClipboard}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy to clipboard</span>
                </Button>
              </div>
            </div>
          )} */}
        </CardContent>
        <CardFooter className="gap-4">
          {!inviteSent ? (
            <Button
              type="submit"
              disabled={isPending || !orgName || !userEmail}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              {isPending ? 'Generating...' : 'Generate Invitation Link'}
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={handleResetForm}>
              Generate Another Link
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SuperAdminClientPage({
  initialOrganizations,
}: {
  initialOrganizations: Organization[];
}) {
  const [organizations, setOrganizations] =
    useState<Organization[]>(initialOrganizations);

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
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto grid w-full max-w-4xl gap-8">
        <CreateOrgForm onOrgCreated={() => fetchOrganizations()} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building /> Existing Organizations
            </CardTitle>
            <CardDescription>
              View all organizations currently in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {organizations.length > 0 ? (
                  organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {org.slug}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground p-4 text-center">
                    No organizations created yet.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
