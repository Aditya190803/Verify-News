/** Next.js build mode — use NODE_ENV only. */

export function isDevBuild(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
}

export function isProdBuild(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
}