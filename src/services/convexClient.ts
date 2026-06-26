'use client';

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

let client: ConvexHttpClient | null = null;

export function getConvexHttpClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  if (!client) client = new ConvexHttpClient(url);
  return client;
}

export async function setConvexAuth(getToken: () => Promise<string | null>) {
  const c = getConvexHttpClient();
  if (!c) return;
  const token = await getToken();
  if (token) c.setAuth(token);
  else c.clearAuth();
}

export { api };