import { readFileSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import { db } from './client';
import { outlets, feeds } from './schema';

type SeedOutlet = {
  id: string;
  name: string;
  domain: string;
  biasLabel: string;
  factuality: string;
  ratingSource: string;
  feedUrl: string;
};

const dataPath = join(import.meta.dir, '../../data/outlets.seed.json');
const rows = JSON.parse(readFileSync(dataPath, 'utf8')) as SeedOutlet[];

for (const row of rows) {
  await db
    .insert(outlets)
    .values({
      id: row.id,
      name: row.name,
      domain: row.domain,
      biasLabel: row.biasLabel,
      factuality: row.factuality,
      ratingSource: row.ratingSource,
    })
    .onConflictDoUpdate({
      target: outlets.id,
      set: {
        name: row.name,
        domain: row.domain,
        biasLabel: row.biasLabel,
        factuality: row.factuality,
        ratingSource: row.ratingSource,
      },
    });

  await db
    .insert(feeds)
    .values({
      id: `feed-${row.id}`,
      outletId: row.id,
      url: row.feedUrl,
      enabled: true,
    })
    .onConflictDoUpdate({
      target: feeds.id,
      set: { url: row.feedUrl, enabled: true },
    });
}

const count = await db.select().from(outlets);
console.log(`Seeded ${count.length} outlets`);
process.exit(0);