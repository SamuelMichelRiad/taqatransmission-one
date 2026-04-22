import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveField, buildFilterParams, fetchMediaFirstPage, setBasePath } from '../api/jsonapi';
import { emptyFilters } from '../types/media';

beforeEach(() => setBasePath('/'));
afterEach(() => vi.restoreAllMocks());

// ---------------------------------------------------------------------------
// resolveField
// ---------------------------------------------------------------------------
describe('resolveField', () => {
  it('reads from root level (flattened Drupal structure)', () => {
    expect(resolveField({ id: '1', name: 'Test' }, 'name')).toBe('Test');
  });

  it('reads from attributes (standard JSON:API structure)', () => {
    expect(resolveField({ id: '1', attributes: { name: 'Attrs' } }, 'name')).toBe('Attrs');
  });

  it('prefers attributes over root when both present', () => {
    expect(
      resolveField({ id: '1', name: 'Root', attributes: { name: 'Attrs' } }, 'name'),
    ).toBe('Attrs');
  });

  it('returns undefined for missing field', () => {
    expect(resolveField({ id: '1' }, 'nonexistent')).toBeUndefined();
  });

  it('reads nested URI from file entity', () => {
    const item = { id: '1', uri: { value: 'public://f.jpg', url: '/sites/default/files/f.jpg' } };
    expect(resolveField<{ url: string }>(item, 'uri')?.url).toBe('/sites/default/files/f.jpg');
  });
});

// ---------------------------------------------------------------------------
// buildFilterParams
// ---------------------------------------------------------------------------
describe('buildFilterParams', () => {
  it('returns empty params for empty filters', () => {
    expect([...buildFilterParams(emptyFilters()).keys()]).toHaveLength(0);
  });

  it('adds CONTAINS filter for non-empty search', () => {
    const p = buildFilterParams({ ...emptyFilters(), search: 'hello' });
    expect(p.get('filter[search][condition][operator]')).toBe('CONTAINS');
    expect(p.get('filter[search][condition][value]')).toBe('hello');
  });

  it('ignores whitespace-only search', () => {
    const p = buildFilterParams({ ...emptyFilters(), search: '   ' });
    expect(p.get('filter[search][condition][value]')).toBeNull();
  });

  it('uses = operator for a single category ID', () => {
    const p = buildFilterParams({ ...emptyFilters(), categoryIds: new Set(['uuid-1']) });
    expect(p.get('filter[cats][condition][operator]')).toBe('=');
    expect(p.get('filter[cats][condition][value]')).toBe('uuid-1');
  });

  it('uses IN operator for multiple category IDs', () => {
    const p = buildFilterParams({
      ...emptyFilters(),
      categoryIds: new Set(['uuid-1', 'uuid-2']),
    });
    expect(p.get('filter[cats][condition][operator]')).toBe('IN');
  });

  it('builds tag, license, and location filter params', () => {
    const p = buildFilterParams({
      ...emptyFilters(),
      tagIds: new Set(['t-1']),
      licenseIds: new Set(['l-1']),
      locationIds: new Set(['loc-1']),
    });
    expect(p.get('filter[tags][condition][path]')).toBe('field_media_tags.id');
    expect(p.get('filter[lic][condition][path]')).toBe('field_media_license.id');
    expect(p.get('filter[loc][condition][path]')).toBe('field_media_location.id');
  });
});

// ---------------------------------------------------------------------------
// fetchMediaFirstPage — network error handling
// ---------------------------------------------------------------------------
describe('fetchMediaFirstPage', () => {
  function makeFetchMock(statusByBundle: Record<string, number | 'ok'>) {
    return vi.fn().mockImplementation((url: string) => {
      const bundle = Object.keys(statusByBundle).find((b) => url.includes(`/media/${b}`));
      const status = bundle ? statusByBundle[bundle] : 404;

      if (status === 'ok') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  type: 'media--image',
                  id: 'img-1',
                  name: 'Test Image',
                  created: '2025-01-01T00:00:00+00:00',
                  thumbnail: { type: 'file--file', id: 'file-1' },
                  field_media_image: { type: 'file--file', id: 'file-1' },
                  field_media_category: [],
                  field_media_tags: [],
                  field_media_license: [],
                  field_media_location: [],
                },
              ],
              included: [
                {
                  type: 'file--file',
                  id: 'file-1',
                  uri: { value: 'public://img.jpg', url: '/sites/default/files/img.jpg' },
                },
              ],
              links: {},
            }),
        });
      }

      return Promise.resolve({
        ok: false,
        status,
        json: () => Promise.resolve({ errors: [] }),
      });
    });
  }

  it('returns items from image bundle and ignores 404 bundles', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock({ image: 'ok', video: 404, remote_video: 404, document: 404, audio: 404 }),
    );

    const result = await fetchMediaFirstPage(emptyFilters());
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Test Image');
  });

  it('treats 400 as empty result (bundle missing filter field)', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock({ image: 'ok', video: 400, remote_video: 400, document: 400, audio: 400 }),
    );

    const result = await fetchMediaFirstPage({
      ...emptyFilters(),
      categoryIds: new Set(['cat-uuid']),
    });
    // Only image bundle returns items; 400 bundles are silently empty
    expect(result.items).toHaveLength(1);
  });

  it('resolves image URL from included file entity', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock({ image: 'ok', video: 404, remote_video: 404, document: 404, audio: 404 }),
    );

    const result = await fetchMediaFirstPage(emptyFilters());
    expect(result.items[0].thumbnailUrl).toBe('/sites/default/files/img.jpg');
    expect(result.items[0].fullUrl).toBe('/sites/default/files/img.jpg');
  });

  it('falls back to /jsonapi/file/file when included has no URI', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/media/image')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  type: 'media--image',
                  id: 'img-1',
                  name: 'Missing URL',
                  created: '2025-01-01T00:00:00+00:00',
                  thumbnail: { type: 'file--file', id: 'file-orphan' },
                  field_media_image: { type: 'file--file', id: 'file-orphan' },
                  field_media_category: [],
                  field_media_tags: [],
                  field_media_license: [],
                  field_media_location: [],
                },
              ],
              // included has the file but WITHOUT uri — triggers fallback
              included: [{ type: 'file--file', id: 'file-orphan' }],
              links: {},
            }),
        });
      }
      if (url.includes('/file/file')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  type: 'file--file',
                  id: 'file-orphan',
                  uri: { value: 'public://fallback.jpg', url: '/sites/default/files/fallback.jpg' },
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMediaFirstPage(emptyFilters());
    expect(result.items[0].thumbnailUrl).toBe('/sites/default/files/fallback.jpg');

    const fileFetchCalls = fetchMock.mock.calls.filter((args: unknown[]) =>
      (args[0] as string).includes('/file/file'),
    );
    expect(fileFetchCalls.length).toBeGreaterThan(0);
  });

  it('sets nextUrl when Drupal returns links.next', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/media/image')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [],
              included: [],
              links: { next: { href: 'http://example.com/jsonapi/media/image?page[offset]=24' } },
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMediaFirstPage(emptyFilters());
    expect(result.nextUrls['image']).toContain('page[offset]=24');
  });
});
