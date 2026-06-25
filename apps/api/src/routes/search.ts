import { Hono } from 'hono';
import { searchForVerify } from '../services/search';

const app = new Hono();

app.post('/', async (c) => {
  const body = await c.req.json<{ query?: string; content?: string }>().catch(() => ({}));
  const q = (body.content ?? body.query ?? '').trim();
  if (!q) return c.json({ error: 'query required' }, 400);
  const results = await searchForVerify(q);
  return c.json({ results });
});

export default app;