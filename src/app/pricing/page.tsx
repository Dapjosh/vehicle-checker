'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { initializePaystackTransactionAction } from '@/app/actions';
import { redirect, useRouter } from 'next/navigation';
import AppHeader from '@/components/app-header';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [isAnnual, setIsAnnual] = useState(false);

  const handleSubscribe = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return redirect('/sign-in');

    setLoading(true);
    try {
      const billingCycle = isAnnual ? 'annual' : 'monthly';
      const result = await initializePaystackTransactionAction(billingCycle);

      if (result.success && result.url) {
        // Redirect user to Paystack to verify card
        window.location.href = result.url;
      } else {
        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: result.error || 'Could not initialize payment.',
        });
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const currentPrice = isAnnual ? '100,000' : '10,000';

  return (
    <div className='min-h-screen bg-gray-50'>
      {user ? (
        // <AppHeader />
        <div className='py-20 px-4 flex flex-col items-center justify-center'>
          <div className='flex items-center justify-center gap-3 mb-8'>
            <span
              className={`text-sm ${!isAnnual ? 'font-bold text-gray-900' : 'text-gray-500'}`}
            >
              Monthly
            </span>

            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-12 items-center rounded-full ${isAnnual ? 'bg-primary' : 'bg-gray-400'} transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>

            <span
              className={`text-sm flex items-center gap-1.5 ${isAnnual ? 'font-bold text-gray-900' : 'text-gray-500'}`}
            >
              Annually
              <span className='rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700'>
                Save two months
              </span>
            </span>
          </div>
          <div className='text-center mb-10'>
            <h1 className='text-4xl font-bold tracking-tight mb-4'>
              Simple, Transparent Pricing
            </h1>
            <p className='text-xl text-black'>
              Start your 30-day free trial. Cancel anytime.
            </p>
          </div>

          <Card className='w-full max-w-md border-2 border-primary shadow-xl dark:border-white'>
            <CardHeader className='text-center pb-8 border-b bg-gray-50/50 dark:bg-gray-900 border-b-gray-200'>
              <CardTitle className='text-2xl font-bold'>Pro Plan</CardTitle>
              <div className='mt-4 flex items-baseline justify-center text-5xl font-extrabold tracking-tight'>
                ₦ {currentPrice}
                <span className='ml-1 text-xl font-medium text-muted-foreground'>
                  {`${isAnnual ? '/year' : '/mo'}`}
                </span>
              </div>
              <CardDescription className='mt-2 text-green-600 font-medium flex items-center justify-center gap-1'>
                <ShieldCheck className='h-4 w-4' /> 30-Day Free Trial Included
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-8 dark:text-white'>
              <ul className='space-y-4'>
                {[
                  'Collate Inspection Reports',
                  'Manage Vehicles',
                  'Add Team Members',
                  'Export Reports to PDF/CSV',
                  'Priority Email/WhatsApp Support',
                ].map((feature) => (
                  <li
                    key={feature}
                    className='flex items-start dark:text-white'
                  >
                    <div className='flex-shrink-0'>
                      <Check className='h-5 w-5 text-primary dark:text-green-500' />
                    </div>
                    <p className='ml-3 text-base text-gray-700 dark:text-white'>
                      {feature}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className='pb-8 pt-4'>
              <Button
                className='w-full text-lg py-6'
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing...
                  </>
                ) : isAnnual ? (
                  'Subscribe Annually'
                ) : (
                  'Subscribe Monthly'
                )}
              </Button>
              <p className='mt-4 text-xs text-center text-muted-foreground w-full'>
                {`You will be charged a refundable ₦50 fee to verify your card.
                The subscription fee of ${!isAnnual ? '₦10,000' : '₦100,000'} will be charged automatically in ${!isAnnual ? '30 days' : 'a year'}.`}
              </p>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className='px-4 py-20 min-h-screen flex flex-col items-center justify-center'>
          <h1 className='text-2xl font-bold'>
            You don't have an account with us yet
          </h1>
          <p>Please sign up or sign in to get started</p>
          <div className='flex gap-3 mt-4'>
            <SignUpButton mode='modal' forceRedirectUrl='/pricing'>
              <Button className='w-md'>Sign Up</Button>
            </SignUpButton>

            <SignInButton mode='modal' forceRedirectUrl='/pricing'>
              <Button className='w-md !bg-red-400'>Sign In</Button>
            </SignInButton>
          </div>
        </div>
      )}
    </div>
  );
}
