import { Hono } from 'hono';
import { eq, gte, and } from 'drizzle-orm';
import { db } from '../db/client';
import { subscriptions, verifications } from '../db/schema';
import { PLAN_LIMITS, planCatalog } from '../lib/plans';
import { getEntitlements } from '../lib/entitlements';
import { requireUserId } from '../middleware/user';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../lib/razorpay';

const app = new Hono();

app.get('/plans', (c) => {
  const catalog = planCatalog();
  return c.json({
    provider: 'razorpay',
    currency: 'INR',
    plans: PLAN_LIMITS,
    catalog,
    billingEnabled: true,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? null,
  });
});

app.get('/entitlements', requireUserId, async (c) => {
  const userId = c.get('userId') as string;
  const ent = await getEntitlements(userId);
  const used = await countVerificationsThisMonth(userId);
  return c.json({ ...ent, verificationsUsedThisMonth: used });
});

/** Create Razorpay order for subscription (monthly; renew via webhook / manual for v1) */
app.post('/checkout', requireUserId, async (c) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return c.json({ error: 'razorpay not configured' }, 501);
  }

  const userId = c.get('userId') as string;
  const body = await c.req.json<{ plan?: string }>().catch(() => ({}));
  const plan = body.plan === 'pro' ? 'pro' : 'plus';
  const item = planCatalog().find((p) => p.id === plan);
  if (!item || item.priceInr <= 0) {
    return c.json({ error: 'invalid plan' }, 400);
  }

  const amountPaise = item.priceInr * 100;
  const order = await createRazorpayOrder({
    amountPaise,
    receipt: `vn_${userId.slice(0, 8)}_${Date.now()}`,
    notes: { userId, plan },
  });

  return c.json({
    provider: 'razorpay',
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    plan,
    planName: item.name,
    priceInr: item.priceInr,
  });
});

/** Client calls after Razorpay handler success */
app.post('/confirm', requireUserId, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req
    .json<{
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      plan?: string;
    }>()
    .catch(() => ({}));

  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  if (!orderId || !paymentId || !signature) {
    return c.json({ error: 'missing payment fields' }, 400);
  }

  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return c.json({ error: 'invalid signature' }, 400);
  }

  const plan = body.plan === 'pro' ? 'pro' : 'plus';
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await upsertSubscription(userId, paymentId, plan, 'active', periodEnd);
  return c.json({ ok: true, plan, currentPeriodEnd: periodEnd.toISOString() });
});

app.post('/webhook/razorpay', async (c) => {
  const raw = await c.req.text();
  const sig = c.req.header('x-razorpay-signature');
  if (!sig || !verifyWebhookSignature(raw, sig)) {
    return c.json({ error: 'invalid signature' }, 400);
  }

  const event = JSON.parse(raw) as {
    event: string;
    payload?: {
      payment?: { entity?: { id?: string; notes?: Record<string, string> } };
      subscription?: { entity?: { notes?: Record<string, string>; status?: string } };
    };
  };

  if (event.event === 'payment.captured') {
    const pay = event.payload?.payment?.entity;
    const userId = pay?.notes?.userId;
    const plan = pay?.notes?.plan === 'pro' ? 'pro' : 'plus';
    if (userId && pay?.id) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      await upsertSubscription(userId, pay.id, plan, 'active', periodEnd);
    }
  }

  return c.json({ received: true });
});

async function upsertSubscription(
  userId: string,
  paymentRef: string | null,
  plan: string,
  status: string,
  currentPeriodEnd?: Date,
) {
  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: paymentRef,
      plan,
      status,
      currentPeriodEnd: currentPeriodEnd ?? null,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: paymentRef,
        plan,
        status,
        currentPeriodEnd: currentPeriodEnd ?? null,
      },
    });
}

export async function countVerificationsThisMonth(userId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const rows = await db
    .select()
    .from(verifications)
    .where(and(eq(verifications.userId, userId), gte(verifications.createdAt, start)));
  return rows.length;
}

export default app;