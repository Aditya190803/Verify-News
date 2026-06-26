const EXA = 'NEXT_PUBLIC_EXA_API_KEY';
const TAVILY = 'NEXT_PUBLIC_TAVILY_API_KEY';

export function getExaApiKey(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return process.env[EXA];
}

export function getTavilyApiKey(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return process.env[TAVILY];
}

export function hasExaKey(): boolean {
  return Boolean(getExaApiKey());
}

export function hasTavilyKey(): boolean {
  return Boolean(getTavilyApiKey());
}