/** Local default matches docker-compose + drizzle.config */
export const DEFAULT_DATABASE_URL = 'postgresql://verify:verify@localhost:5432/verifynews';

export function databaseUrl(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}