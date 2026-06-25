import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '../../../../convex/_generated/api';

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  if (expected !== sig) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const shared = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
  if (!shared) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 501 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    payload?: { payment?: { entity?: { id?: string; notes?: Record<string, string> } } };
  };

  if (event.event === 'payment.captured') {
    const pay = event.payload?.payment?.entity;
    const userId = pay?.notes?.userId;
    const plan = pay?.notes?.plan === 'pro' ? 'pro' : 'plus';
    if (userId && pay?.id) {
      await fetchMutation(api.billing.applyWebhookPayment, {
        userId,
        plan,
        paymentId: pay.id,
        sharedSecret: shared,
      });
    }
  }

  return NextResponse.json({ received: true });
}