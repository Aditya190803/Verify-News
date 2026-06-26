import { describe, expect, it, vi, afterEach } from 'vitest';
import { getExaApiKey, hasExaKey } from './env';

describe('search env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads NEXT_PUBLIC_EXA_API_KEY', () => {
    vi.stubEnv('NEXT_PUBLIC_EXA_API_KEY', 'exa-test');
    expect(getExaApiKey()).toBe('exa-test');
    expect(hasExaKey()).toBe(true);
  });
});