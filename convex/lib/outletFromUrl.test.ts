import { describe, expect, it } from 'vitest';
import { outletExternalIdForUrl } from './outletFromUrl';

describe('outletFromUrl', () => {
  it('maps thehindu URLs', () => {
    expect(outletExternalIdForUrl('https://www.thehindu.com/news/national/x/article123.e456')).toBe('the-hindu');
  });
  it('rejects unknown domains', () => {
    expect(outletExternalIdForUrl('https://www.cnn.com/foo')).toBeNull();
  });
});