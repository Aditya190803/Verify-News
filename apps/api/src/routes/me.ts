import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { outlets, userBiasProfile, userFollows } from '../db/schema';
import { requireUserId } from '../middleware/user';

const app = new Hono();

app.use('*', requireUserId);

app.get('/follows', async (c) => {
  const userId = c.get('userId') as string;
  const rows = await db
    .select({ outletId: userFollows.outletId, name: outlets.name, biasLabel: outlets.biasLabel })
    .from(userFollows)
    .innerJoin(outlets, eq(userFollows.outletId, outlets.id))
    .where(eq(userFollows.userId, userId));
  return c.json({ follows: rows });
});

app.put('/follows/:outletId', async (c) => {
  const userId = c.get('userId') as string;
  const outletId = c.req.param('outletId');
  const [o] = await db.select().from(outlets).where(eq(outlets.id, outletId)).limit(1);
  if (!o) return c.json({ error: 'outlet not found' }, 404);
  await db.insert(userFollows).values({ userId, outletId }).onConflictDoNothing();
  return c.json({ ok: true });
});

app.delete('/follows/:outletId', async (c) => {
  const userId = c.get('userId') as string;
  const outletId = c.req.param('outletId');
  await db
    .delete(userFollows)
    .where(and(eq(userFollows.userId, userId), eq(userFollows.outletId, outletId)));
  return c.json({ ok: true });
});

app.get('/bias-profile', async (c) => {
  const userId = c.get('userId') as string;
  const [row] = await db
    .select()
    .from(userBiasProfile)
    .where(eq(userBiasProfile.userId, userId))
    .limit(1);
  return c.json({ selfReportedLean: row?.selfReportedLean ?? null });
});

app.put('/bias-profile', async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json<{ selfReportedLean?: string }>().catch(() => ({}));
  const lean = body.selfReportedLean?.trim() || null;
  await db
    .insert(userBiasProfile)
    .values({ userId, selfReportedLean: lean, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userBiasProfile.userId,
      set: { selfReportedLean: lean, updatedAt: new Date() },
    });
  return c.json({ ok: true, selfReportedLean: lean });
});

export default app;