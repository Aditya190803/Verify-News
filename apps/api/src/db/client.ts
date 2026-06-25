import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { databaseUrl } from '../lib/env';

const url = databaseUrl();

// ponytail: one connection per API process; pool sizing when traffic matters
const client = postgres(url, { max: 10 });
export const db = drizzle(client, { schema });