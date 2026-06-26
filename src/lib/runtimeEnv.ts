/** Vite exposes import.meta.env; Next does not — use NODE_ENV as fallback. */

export function isDevBuild(): boolean {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') return true;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return false;
  try {
    const im = import.meta as ImportMeta & { env?: { DEV?: boolean } };
    return Boolean(im.env?.DEV);
  } catch {
    return false;
  }
}

export function isProdBuild(): boolean {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return true;
  try {
    const im = import.meta as ImportMeta & { env?: { PROD?: boolean } };
    return Boolean(im.env?.PROD);
  } catch {
    return false;
  }
}

export function viteEnv(name: string): string | undefined {
  try {
    const im = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
    return im.env?.[name];
  } catch {
    return undefined;
  }
}