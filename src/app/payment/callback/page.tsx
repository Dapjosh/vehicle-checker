'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyAndSubscribeAction } from '@/app/actions';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('No transaction reference found.');
      return;
    }

    const processSubscription = async () => {
      try {
        const result = await verifyAndSubscribeAction(reference);

        if (result.success) {
          setStatus('success');
          // Optional: Redirect automatically after 3 seconds
          setTimeout(() => router.push('/'), 3000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Verification failed');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    processSubscription();
  }, [reference, router]);

  return (
    <div className= "flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4" >
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center" >

      {status === 'processing' && (
        <div className="flex flex-col items-center" >
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold" > Verifying Payment...</h2>
              <p className = "text-muted-foreground mt-2" > Setting up your 14 - day trial.</p>
                </div>
        )
}

{
  status === 'success' && (
    <div className="flex flex-col items-center" >
      <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold" > Subscription Active! </h2>
          < p className = "text-muted-foreground mt-2" >
            Your 14 - day free trial has started.Redirecting you to the dashboard...
  </p>
    < Button asChild className = "mt-6" >
      <Link href="/" > Go to Dashboard </Link>
        </Button>
        </div>
        )
}

{
  status === 'error' && (
    <div className="flex flex-col items-center" >
      <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold" > Something went wrong </h2>
          < p className = "text-red-500 mt-2" > { message } </p>
            < Button asChild variant = "outline" className = "mt-6" >
              <Link href="/pricing" > Try Again </Link>
                </Button>
                </div>
        )
}

</div>
  </div>
  );
}