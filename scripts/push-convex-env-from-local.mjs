#!/usr/bin/env node
/** Push UPLOAD → Convex vars from .env.local (see docs/ENV.md). */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve } from 'path';

// UPLOAD → Convex section in .env.local (see docs/ENV.md)
const KEYS = [
  'CLERK_JWT_ISSUER_DOMAIN',
  'OPENCODE_API_KEY',
  'EXA_API_KEY',
  'BIGPICKLE_MODEL',
  'OPENCODE_ZEN_BASE_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_PRICE_PLUS_INR',
  'RAZORPAY_PRICE_PRO_INR',
  'CONVEX_WEBHOOK_SHARED_SECRET',
];

const path = resolve(process.cwd(), '.env.local');
if (!existsSync(path)) {
  console.error('Missing .env.local');
  process.exit(1);
}

const vars = {};
for (const line of readFileSync(path, 'utf8').splitlines()) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const [k, ...rest] = t.split('=');
  vars[k.trim()] = rest.join('=').trim();
}

let ok = 0;
if (!vars.EXA_API_KEY && vars.NEXT_PUBLIC_EXA_API_KEY) {
  vars.EXA_API_KEY = vars.NEXT_PUBLIC_EXA_API_KEY;
}

for (const key of KEYS) {
  const val = vars[key];
  if (val === undefined || val === '') {
    console.log(`skip ${key} (empty)`);
    continue;
  }
  console.log(`set ${key}`);
  const r = spawnSync('npx', ['convex', 'env', 'set', key, val], { stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
  ok++;
}
console.log(ok ? `Pushed ${ok} variable(s).` : 'Nothing to push — fill keys in .env.local first.');