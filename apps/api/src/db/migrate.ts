import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');

const migrationsFolder = new URL('../../drizzle', import.meta.url).pathname;
const client = postgres(url, { max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder });
await client.end();
console.log('Migrations applied');