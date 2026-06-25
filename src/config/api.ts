import { getStackAccessToken } from '@/lib/stackAuthToken';

const envBase = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
/** In dev, Vite proxies /api → localhost:3001 when VITE_API_URL is unset */
const base = envBase || (import.meta.env.DEV ? '/api' : '');

export const apiBaseUrl = base;

export function apiUrl(path: string): string {
  if (!base) return '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export const isAggregationApiEnabled = Boolean(base);

export function getStoredUserId(): string | undefined {
  try {
    return localStorage.getItem('vn_user_id') ?? undefined;
  } catch {
    return undefined;
  }
}

export async function apiHeaders(userId?: string | null): Promise<HeadersInit> {
  const h: Record<string, string> = {};
  const token = await getStackAccessToken();
  if (token) {
    h.Authorization = `Bearer ${token}`;
  } else if (import.meta.env.DEV && import.meta.env.VITE_AUTH_TRUST_HEADER === 'true') {
    const id = userId ?? getStoredUserId();
    if (id) h['X-User-Id'] = id;
  }
  return h;
}