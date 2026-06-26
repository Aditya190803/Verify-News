#!/usr/bin/env node
/**
 * Re-apply Clerk dev keys into .env.local after `convex dev` overwrites the file.
 * Preserves Convex deployment lines; updates or appends Clerk + other LOCAL vars.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const envLocal = resolve(root, '.env.local');
const envExample = resolve(root, '.env.example');

const CLERK_KEYS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL',
];

const pull = spawnSync(
  'clerk',
  ['env', 'pull', '--app', 'app_3Ff8NcoPHzGIjkXQHpcnqZUNK01', '--instance', 'dev', '--file', '.env.clerk.tmp'],
  { cwd: root, encoding: 'utf8' },
);

if (pull.status !== 0) {
  console.error(pull.stderr || pull.stdout || 'clerk env pull failed');
  process.exit(pull.status ?? 1);
}

const tmpPath = resolve(root, '.env.clerk.tmp');
const pulled = readFileSync(tmpPath, 'utf8');
const pulledVars = new Map();
for (const line of pulled.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) pulledVars.set(m[1], m[2]);
}

let lines = existsSync(envLocal) ? readFileSync(envLocal, 'utf8').split('\n') : [];
if (lines.length === 0 && existsSync(envExample)) {
  lines = readFileSync(envExample, 'utf8').split('\n');
}

const seen = new Set();
const out = lines.map((line) => {
  const m = line.match(/^([A-Z0-9_]+)=/);
  if (!m || !CLERK_KEYS.includes(m[1])) return line;
  seen.add(m[1]);
  const value = pulledVars.get(m[1]);
  return value !== undefined ? `${m[1]}=${value}` : line;
});

for (const key of CLERK_KEYS) {
  if (!seen.has(key) && pulledVars.has(key)) {
    out.push(`${key}=${pulledVars.get(key)}`);
  }
}

writeFileSync(envLocal, out.join('\n').replace(/\n*$/, '\n'));
writeFileSync(tmpPath, ''); // truncate temp; clerk wrote secrets here

const pk = pulledVars.get('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') ?? '';
if (pk.startsWith('pk_live_')) {
  console.error('Refusing to merge production Clerk keys into local .env.local');
  process.exit(1);
}

console.log('Merged Clerk dev keys into .env.local');