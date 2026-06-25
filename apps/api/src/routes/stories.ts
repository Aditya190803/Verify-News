import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import type { StoryDto } from '@verify-news/shared';
import { db } from '../db/client';
import { storyClusters } from '../db/schema';
import { buildStoryDto } from '../lib/storyDto';
import { rankStoriesForUser } from '../lib/feedRank';
import { optionalUserId } from '../middleware/user';

const app = new Hono();

app.use('*', optionalUserId);

app.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 30), 100);
  const userId = c.get('userId') as string | undefined;
  const stories = await db
    .select()
    .from(storyClusters)
    .orderBy(desc(storyClusters.lastUpdatedAt))
    .limit(limit);

  const dtos: StoryDto[] = [];
  for (const s of stories) {
    const dto = await buildStoryDto(s.id, userId);
    if (dto) dtos.push(dto);
  }
  const ranked = await rankStoriesForUser(dtos, userId);
  return c.json({ stories: ranked, personalized: Boolean(userId) });
});

app.get('/:idOrSlug', async (c) => {
  const key = c.req.param('idOrSlug');
  const userId = c.get('userId') as string | undefined;
  const byId = await db.select().from(storyClusters).where(eq(storyClusters.id, key)).limit(1);
  const bySlug =
    byId.length > 0
      ? byId
      : await db.select().from(storyClusters).where(eq(storyClusters.slug, key)).limit(1);
  const [story] = bySlug;
  if (!story) return c.json({ error: 'not found' }, 404);
  const dto = await buildStoryDto(story.id, userId);
  return c.json({ story: dto });
});

export default app;