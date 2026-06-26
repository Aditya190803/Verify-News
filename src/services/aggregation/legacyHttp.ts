import { apiBaseUrl, apiHeaders, apiUrl } from '@/config/api';

export async function legacyFetch(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  if (!url) throw new Error('Aggregation API URL is not configured');
  const auth = await apiHeaders();
  return fetch(url, { ...init, headers: { ...auth, ...init?.headers } });
}

export async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<') || trimmed.startsWith('<!')) {
    throw new Error(`Got a web page instead of API data. Base URL: "${apiBaseUrl}".`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Could not read API response (HTTP ${res.status}).`);
  }
}

/** Auth-required legacy endpoints return null; other failures throw. */
export function isAuthError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('Not authenticated') || msg.includes('401');
}