import { Hono } from 'hono';
import { asc } from 'drizzle-orm';
import { db } from '../db/client';
import { outlets } from '../db/schema';

const app = new Hono();

app.get('/', async (c) => {
  const rows = await db.select().from(outlets).orderBy(asc(outlets.name));
  return c.json({
    outlets: rows.map((r) => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      biasLabel: r.biasLabel,
      factuality: r.factuality,
    })),
  });
});

export default app;