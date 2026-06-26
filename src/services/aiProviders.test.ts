import { describe, it, expect } from 'vitest';
import { verifyWithFallback, getMediaTypeFromMime } from './aiProviders';

describe('aiProviders stubs', () => {
  it('verifyWithFallback returns unverified stub', async () => {
    const r = await verifyWithFallback('test');
    expect(r.veracity).toBe('unverified');
    expect(r.explanation).toContain('Convex');
  });

  it('getMediaTypeFromMime', () => {
    expect(getMediaTypeFromMime('image/png')).toBe('image');
    expect(getMediaTypeFromMime('text/plain')).toBe('text');
  });
});