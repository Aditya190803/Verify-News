'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import { planCatalog } from './lib/plans';
import { createHmac } from 'crypto';

export const confirmPayment = action({
  args: {
    razorpay_order_id: v.string(),
    razorpay_payment_id: v.string(),
    razorpay_signature: v.string(),
    plan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const userId = identity.subject;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('razorpay not configured');
    const body = `${args.razorpay_order_id}|${args.razorpay_payment_id}`;
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== args.razorpay_signature) throw new Error('invalid signature');
    const plan = args.plan === 'pro' ? 'pro' : 'plus';
    const periodEnd = Date.now() + 30 * 86_400_000;
    await ctx.runMutation(internal.billing.upsertSubscription, {
      userId,
      plan,
      status: 'active',
      paymentRef: args.razorpay_payment_id,
      currentPeriodEnd: periodEnd,
    });
    return { ok: true as const, plan, currentPeriodEnd: new Date(periodEnd).toISOString() };
  },
});

export const createOrder = action({
  args: { plan: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const userId = identity.subject;
    const plan = args.plan === 'pro' ? 'pro' : 'plus';
    const item = planCatalog().find((p) => p.id === plan);
    if (!item || item.priceInr <= 0) throw new Error('invalid plan');
    const key = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key || !secret) throw new Error('razorpay not configured');
    const amountPaise = item.priceInr * 100;
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `vn_${userId.slice(0, 8)}_${Date.now()}`.slice(0, 40),
        notes: { userId, plan },
      }),
    });
    if (!res.ok) throw new Error(`Razorpay order: ${await res.text()}`);
    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      provider: 'razorpay' as const,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key,
      plan,
      planName: item.name,
      priceInr: item.priceInr,
    };
  },
});