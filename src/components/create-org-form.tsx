import { useState, useCallback } from 'react';
import { useTransition } from 'react';
import { createOrganizationAndInvite, getAllOrganizations } from '@/app/actions';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Building, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
export default function CreateOrgForm({ onOrgCreated }: { onOrgCreated: () => void }) {
  const [orgName, setOrgName] = useState('');
  const allOrganization = useCallback(() => getAllOrganizations(), []);
  console.log(allOrganization());
  const [userEmail, setUserEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();



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
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Generate Link',
          description: result.message,
        });
      }
    });
  };

  const handleResetForm = () => {
    setOrgName('');
    setUserEmail('');
  };

  return (
    <div className="max-w-full mx-auto">
      
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
    </div>
  );
}