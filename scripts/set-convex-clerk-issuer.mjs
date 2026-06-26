#!/usr/bin/env node
/**
 * Sets CLERK_JWT_ISSUER_DOMAIN on the linked Convex deployment from
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local (Clerk dev Frontend API URL).
 */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('Missing .env.local — run: bun run env:clerk');
  process.exit(1);
}

const text = readFileSync(envPath, 'utf8');
const m = text.match(/^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)$/m);
if (!m) {
  console.error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not in .env.local');
  process.exit(1);
}

const pk = m[1].trim().replace(/^["']|["']$/g, '');
// pk_test_<base64(frontendApi$)> — decode middle segment for *.clerk.accounts.dev host
const b64 = pk.replace(/^pk_(test|live)_/, '');
let host;
try {
  const decoded = Buffer.from(b64, 'base64').toString('utf8').replace(/\$$/, '');
  host = decoded.includes('.clerk.') ? decoded : null;
} catch {
  host = null;
}

if (!host) {
  console.error(
    'Could not derive issuer from publishable key. Set manually:\n' +
      '  npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://YOUR.clerk.accounts.dev"\n' +
      '(Clerk Dashboard → Configure → Convex integration → Frontend API URL)',
  );
  process.exit(1);
}

const issuer = host.startsWith('http') ? host : `https://${host}`;
console.log(`Setting CLERK_JWT_ISSUER_DOMAIN=${issuer}`);
const r = spawnSync('npx', ['convex', 'env', 'set', 'CLERK_JWT_ISSUER_DOMAIN', issuer], {
  stdio: 'inherit',
  shell: true,
});
process.exit(r.status ?? 1);