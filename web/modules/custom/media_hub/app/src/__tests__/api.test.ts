import { describe, it, expect } from 'vitest';
import { resolveField, buildFilterParams } from '../api/jsonapi';
import { emptyFilters } from '../types/media';

describe('resolveField', () => {
  it('reads from root level (flattened Drupal structure)', () => {
    const item = { id: '1', name: 'Test', type: 'media--image' };
    expect(resolveField(item, 'name')).toBe('Test');
  });

  it('reads from attributes (standard JSON:API structure)', () => {
    const item = { id: '1', type: 'media--image', attributes: { name: 'From attributes' } };
    expect(resolveField(item, 'name')).toBe('From attributes');
  });

  it('prefers attributes over root when both present', () => {
    const item = { id: '1', name: 'Root', type: 'media--image', attributes: { name: 'Attributes' } };
    expect(resolveField(item, 'name')).toBe('Attributes');
  });

  it('returns undefined for missing field', () => {
    const item = { id: '1', type: 'media--image' };
    expect(resolveField(item, 'nonexistent')).toBeUndefined();
  });

  it('reads nested URI from file entity', () => {
    const item = {
      id: '1',
      type: 'file--file',
      uri: { value: 'public://test.jpg', url: '/sites/default/files/test.jpg' },
    };
    const uri = resolveField<{ url: string }>(item, 'uri');
    expect(uri?.url).toBe('/sites/default/files/test.jpg');
  });
});

describe('buildFilterParams', () => {
  it('returns empty params for empty filters', () => {
    const p = buildFilterParams(emptyFilters());
    expect([...p.keys()]).toHaveLength(0);
  });

  it('adds CONTAINS filter for search', () => {
    const p = buildFilterParams({ ...emptyFilters(), search: 'hello' });
    expect(p.get('filter[search][condition][operator]')).toBe('CONTAINS');
    expect(p.get('filter[search][condition][value]')).toBe('hello');
  });

  it('adds IN filter for multiple category IDs', () => {
    const p = buildFilterParams({
      ...emptyFilters(),
      categoryIds: new Set(['uuid-1', 'uuid-2']),
    });
    expect(p.get('filter[cats][condition][operator]')).toBe('IN');
    expect(p.getAll('filter[cats][condition][value][0]')).toContain('uuid-1');
  });

  it('adds = filter for single category ID', () => {
    const p = buildFilterParams({
      ...emptyFilters(),
      categoryIds: new Set(['uuid-1']),
    });
    expect(p.get('filter[cats][condition][operator]')).toBe('=');
    expect(p.get('filter[cats][condition][value]')).toBe('uuid-1');
  });

  it('ignores whitespace-only search', () => {
    const p = buildFilterParams({ ...emptyFilters(), search: '   ' });
    expect(p.get('filter[search][condition][value]')).toBeNull();
  });
});
