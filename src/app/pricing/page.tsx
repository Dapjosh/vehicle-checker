'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function PricingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return redirect('/sign-in');

    setLoading(true);
    try {
      const result = await initializePaystackTransactionAction(
        user.primaryEmailAddress.emailAddress
      );

      if (result.success && result.url) {
        // Redirect user to Paystack to verify card
        window.location.href = result.url;
      } else {
        alert(result.error || 'Failed to start payment');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="py-20 px-4 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-black">
            Start your 14-day free trial. Cancel anytime.
          </p>
        </div>

        <Card className="w-full max-w-md border-2 border-primary shadow-xl dark:border-white">
          <CardHeader className="text-center pb-8 border-b bg-gray-50/50 dark:bg-gray-900 border-b-gray-200">
            <CardTitle className="text-2xl font-bold">Pro Plan</CardTitle>
            <div className="mt-4 flex items-baseline justify-center text-5xl font-extrabold tracking-tight">
              ₦15,000
              <span className="ml-1 text-xl font-medium text-muted-foreground">
                /mo
              </span>
            </div>
            <CardDescription className="mt-2 text-green-600 font-medium flex items-center justify-center gap-1">
              <ShieldCheck className="h-4 w-4" /> 30-Day Free Trial Included
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 dark:text-white">
            <ul className="space-y-4">
              {[
                'Collate Inspection Reports',
                'Manage Vehicles',
                'Add Team Members',
                'Export Reports to PDF/CSV',
                'Priority Email/WhatsApp Support',
              ].map((feature) => (
                <li key={feature} className="flex items-start dark:text-white">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-primary dark:text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700 dark:text-white">
                    {feature}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pb-8 pt-4">
            <Button
              className="w-full text-lg py-6"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start 14-Day Free Trial'
              )}
            </Button>
            <p className="mt-4 text-xs text-center text-muted-foreground w-full">
              You will be charged a refundable ₦50 fee to verify your card. The
              subscription fee of ₦15,000 will be charged automatically in 30
              days.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
