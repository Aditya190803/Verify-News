import { getStackAccessToken } from '@/lib/stackAuthToken';

const nextConvex =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_CONVEX_URL : undefined;

function viteMeta() {
  try {
    return import.meta.env;
  } catch {
    return undefined;
  }
}

const vite = viteMeta();
const envBase =
  vite?.VITE_API_URL?.replace(/\/$/, '') ??
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') : '') ??
  '';

export const isAggregationApiEnabled = Boolean(nextConvex) || Boolean(envBase) || Boolean(vite?.DEV);

const base = nextConvex ? '' : envBase || (vite?.DEV ? '/api' : '');

export const apiBaseUrl = base;

export function apiUrl(path: string): string {
  if (nextConvex) return '';
  if (!base) return '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

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
  } else if (vite?.DEV && vite.VITE_AUTH_TRUST_HEADER === 'true') {
    const id = userId ?? getStoredUserId();
    if (id) h['X-User-Id'] = id;
  }
  return h;
}