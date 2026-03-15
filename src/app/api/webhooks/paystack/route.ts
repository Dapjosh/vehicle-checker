import { clerkClient } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY is missing in environment variables.');
      return new Response('Server configuration error', { status: 500 });
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');
    if (hash !== signature) {
      console.error('Invalid Paystack signature. Aborting.');
      return new Response('Invalid signature', { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const orgId = data.metadata?.orgId;

      if (!orgId) {
        console.error(
          'Webhook received, but no orgId found in transaction metadata.',
        );
        return new Response('Missing orgId in metadata', { status: 400 });
      }

      await adminDb.doc(`organizations/${orgId}`).set(
        {
          plan: 'monthly',
          paymentStatus: 'active',
          lastPaidAt: new Date().toISOString(),
        },
        { merge: true },
      );

      const clerk = await clerkClient();
      await clerk.organizations.updateOrganizationMetadata(orgId, {
        publicMetadata: {
          plan: 'monthly',
          paymentStatus: 'active',
        },
      });

      console.log(`Successfully unlocked platform access for org: ${orgId}`);
    }

    return new Response('Webhook handled successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}
