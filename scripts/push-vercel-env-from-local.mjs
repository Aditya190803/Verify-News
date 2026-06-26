#!/usr/bin/env node
/** Push LOCAL → Next.js vars from .env.local to Vercel (see docs/ENV.md). */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve } from 'path';

const KEYS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL',
  'NEXT_PUBLIC_CONVEX_URL',
  'NEXT_PUBLIC_CONVEX_SITE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_EXA_API_KEY',
  'NEXT_PUBLIC_TAVILY_API_KEY',
  'RAZORPAY_WEBHOOK_SECRET',
  'CONVEX_WEBHOOK_SHARED_SECRET',
];

const LEGACY_KEYS = [
  'VITE_TAVILY_API_KEY',
  'VITE_GEMINI_MODEL',
  'VITE_OPENROUTER_API_KEY',
  'VITE_OPENROUTER_MODEL',
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'APPWRITE_API_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_LANGSEARCH_API_KEY',
  'VITE_STACK_PROJECT_ID',
  'VITE_STACK_PUBLISHABLE_CLIENT_KEY',
  'STACK_SECRET_SERVER_KEY',
];

const ENVS = ['production', 'preview', 'development'];
const path = resolve(process.cwd(), '.env.local');
const clerkProdPath = resolve(process.cwd(), '.env.clerk.prod');

const CLERK_KEYS = ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'];

function run(cmd, args, input) {
  const r = spawnSync(cmd, args, {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function parseEnvFile(filePath) {
  const vars = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const eq = t.indexOf('=');
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

function loadClerkProdVars() {
  if (!existsSync(clerkProdPath)) {
    const pull = run('clerk', [
      'env',
      'pull',
      '--app',
      'app_3Ff8NcoPHzGIjkXQHpcnqZUNK01',
      '--instance',
      'prod',
      '--file',
      '.env.clerk.prod',
    ]);
    if (pull.status !== 0) return {};
  }
  if (!existsSync(clerkProdPath)) return {};
  return parseEnvFile(clerkProdPath);
}

function valueFor(key, env, vars, clerkProd) {
  if (CLERK_KEYS.includes(key) && env === 'production') {
    return clerkProd[key] ?? vars[key] ?? '';
  }
  if (key === 'NEXT_PUBLIC_SITE_URL' && env === 'production') {
    return 'https://facets.adityamer.dev';
  }
  if (key === 'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL' && !vars[key]) {
    return '/dashboard';
  }
  if (key === 'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL' && !vars[key]) {
    return '/';
  }
  return vars[key] ?? '';
}

function upsert(name, env, value) {
  let { status, stderr } = run('vercel', ['env', 'update', name, env, '--yes'], value);
  if (status !== 0) {
    ({ status, stderr } = run('vercel', ['env', 'add', name, env, '--yes'], value));
    if (status !== 0) {
      console.error(`failed upsert ${name} (${env}): ${stderr.trim()}`);
      return false;
    }
    console.log(`added ${name} → ${env}`);
    return true;
  }
  console.log(`updated ${name} → ${env}`);
  return true;
}

function removeLegacy(name, env) {
  const { status, stderr } = run('vercel', ['env', 'remove', name, env, '--yes'], undefined);
  if (status !== 0) {
    if (stderr.includes('not found') || stderr.includes('Environment Variable not found')) {
      return true;
    }
    console.error(`failed remove ${name} (${env}): ${stderr.trim()}`);
    return false;
  }
  console.log(`removed legacy ${name} → ${env}`);
  return true;
}

if (!existsSync(path)) {
  console.error('Missing .env.local');
  process.exit(1);
}

const vars = parseEnvFile(path);
const clerkProd = loadClerkProdVars();
let ok = 0;

for (const key of KEYS) {
  for (const env of ENVS) {
    const val = valueFor(key, env, vars, clerkProd);
    if (!val) {
      console.log(`skip ${key} (${env}) — empty`);
      continue;
    }
    if (upsert(key, env, val)) ok++;
  }
}

for (const key of LEGACY_KEYS) {
  for (const env of ENVS) {
    removeLegacy(key, env);
  }
}

console.log(ok ? `Synced ${ok} Vercel env value(s).` : 'No variables synced — fill .env.local first.');