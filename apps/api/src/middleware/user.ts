import type { Context, Next } from 'hono';
import { requireAuth, resolveUserId } from './auth';

export async function requireUserId(c: Context, next: Next) {
  return requireAuth(c, next);
}

export async function optionalUserId(c: Context, next: Next) {
  const userId = await resolveUserId(c);
  if (userId) c.set('userId', userId);
  await next();
}