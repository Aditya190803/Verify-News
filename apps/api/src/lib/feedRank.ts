import { eq } from 'drizzle-orm';
import type { StoryDto } from '@verify-news/shared';
import { db } from '../db/client';
import { userFollows } from '../db/schema';

export async function rankStoriesForUser(stories: StoryDto[], userId?: string): Promise<StoryDto[]> {
  if (!userId) return stories;
  const follows = await db
    .select({ outletId: userFollows.outletId })
    .from(userFollows)
    .where(eq(userFollows.userId, userId));
  const followSet = new Set(follows.map((f) => f.outletId));
  if (followSet.size === 0) return stories;

  return [...stories].sort((a, b) => {
    const score = (s: StoryDto) => {
      const hit = s.articles.some((art) => followSet.has(art.outletId));
      return hit ? 1 : 0;
    };
    return score(b) - score(a) || b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
  });
}