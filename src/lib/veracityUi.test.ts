import { describe, expect, it } from 'vitest';
import { normalizeVeracity, veracityLabel } from './veracityUi';

describe('veracityUi', () => {
  it('maps server and legacy labels', () => {
    expect(normalizeVeracity('verified')).toBe('true');
    expect(normalizeVeracity('misleading')).toBe('false');
    expect(normalizeVeracity('partially-true')).toBe('partially-true');
    expect(veracityLabel('true')).toBe('True');
  });
});