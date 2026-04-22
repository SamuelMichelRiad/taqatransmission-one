import { describe, it, expect } from 'vitest';
import { resolveField } from '../api/jsonapi';

describe('resolveField', () => {
  it('reads from root level (flattened Drupal structure)', () => {
    const item = { id: '1', name: 'Test', type: 'media--image' };
    expect(resolveField(item, 'name')).toBe('Test');
  });

  it('reads from attributes (standard JSON:API structure)', () => {
    const item = {
      id: '1',
      type: 'media--image',
      attributes: { name: 'From attributes' },
    };
    expect(resolveField(item, 'name')).toBe('From attributes');
  });

  it('prefers attributes over root when both present', () => {
    const item = {
      id: '1',
      name: 'Root',
      type: 'media--image',
      attributes: { name: 'Attributes' },
    };
    expect(resolveField(item, 'name')).toBe('Attributes');
  });

  it('returns undefined for missing field', () => {
    const item = { id: '1', type: 'media--image' };
    expect(resolveField(item, 'nonexistent')).toBeUndefined();
  });

  it('reads nested object fields', () => {
    const item = {
      id: '1',
      type: 'file--file',
      uri: { value: 'public://test.jpg', url: '/sites/default/files/test.jpg' },
    };
    const uri = resolveField<{ url: string }>(item, 'uri');
    expect(uri?.url).toBe('/sites/default/files/test.jpg');
  });
});
