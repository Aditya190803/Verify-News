#!/usr/bin/env node
/**
 * Add Clerk production DNS CNAMEs for facets.adityamer.dev on Cloudflare.
 * Requires: CLOUDFLARE_API_TOKEN (Zone DNS:Edit)
 * Optional: CLOUDFLARE_ZONE_ID — auto-resolved for adityamer.dev if omitted
 */
import { spawnSync } from 'node:child_process';

const ZONE_NAME = 'adityamer.dev';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

const RECORDS = [
  { name: 'accounts.facets', content: 'accounts.clerk.services' },
  { name: 'clerk.facets', content: 'frontend-api.clerk.services' },
  { name: 'clkmail.facets', content: 'mail.shc4l5qfg9iy.clerk.services' },
  { name: 'clk._domainkey.facets', content: 'dkim1.shc4l5qfg9iy.clerk.services' },
  { name: 'clk2._domainkey.facets', content: 'dkim2.shc4l5qfg9iy.clerk.services' },
];

async function cf(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(JSON.stringify(body.errors ?? body, null, 2));
  }
  return body;
}

async function resolveZoneId() {
  if (ZONE_ID) return ZONE_ID;
  const { result } = await cf(`/zones?name=${ZONE_NAME}`);
  if (!result?.length) throw new Error(`Zone not found: ${ZONE_NAME}`);
  return result[0].id;
}

async function listRecords(zoneId) {
  const names = RECORDS.map((r) => r.name);
  const { result } = await cf(`/zones/${zoneId}/dns_records?per_page=100`);
  return result.filter((r) => names.includes(r.name));
}

async function upsertRecord(zoneId, { name, content }, existing) {
  const match = existing.find((r) => r.name === name);
  const payload = { type: 'CNAME', name, content, proxied: false, ttl: 1 };

  if (match) {
    if (match.type === 'CNAME' && match.content === content && match.proxied === false) {
      console.log(`ok  ${name} → ${content} (already correct)`);
      return;
    }
    await cf(`/zones/${zoneId}/dns_records/${match.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    console.log(`updated ${name} → ${content}`);
    return;
  }

  await cf(`/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  console.log(`added ${name} → ${content}`);
}

if (!TOKEN) {
  console.error('Set CLOUDFLARE_API_TOKEN (Zone DNS:Edit for adityamer.dev)');
  process.exit(1);
}

try {
  const zoneId = await resolveZoneId();
  console.log(`Zone: ${ZONE_NAME} (${zoneId})`);
  const existing = await listRecords(zoneId);
  for (const record of RECORDS) {
    await upsertRecord(zoneId, record, existing);
  }
  console.log('\nDone. Wait 1–5 min, then run Verify in Clerk Dashboard.');
} catch (err) {
  console.error(err.message ?? err);
  process.exit(1);
}