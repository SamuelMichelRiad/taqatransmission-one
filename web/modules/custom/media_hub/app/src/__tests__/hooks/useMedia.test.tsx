import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMedia } from '../../hooks/useMedia';
import * as jsonapi from '../../api/jsonapi';
import { emptyFilters } from '../../types/media';
import type { MediaItem } from '../../types/media';

function makeItem(id: string, created = '2025-01-01T00:00:00+00:00'): MediaItem {
  return {
    id,
    name: `Item ${id}`,
    bundle: 'image',
    thumbnailUrl: '',
    fullUrl: '',
    downloadUrl: '',
    caption: '',
    categoryIds: [],
    tagIds: [],
    licenseIds: [],
    locationIds: [],
    assetTypeIds: [],
    graphicalElementIds: [],
    peopleFeaturedIds: [],
    publicationIds: [],
    siteIds: [],
    solutionSegmentIds: [],
    themeIds: [],
    created,
    videoUrl: '',
  };
}

const emptyNextUrls = {
  image: null,
  video: null,
  remote_video: null,
  document: null,
  audio: null,
};

afterEach(() => vi.restoreAllMocks());

describe('useMedia', () => {
  it('starts in loading state then resolves items', async () => {
    vi.spyOn(jsonapi, 'fetchMediaFirstPage').mockResolvedValue({
      items: [makeItem('1'), makeItem('2')],
      nextUrls: emptyNextUrls,
    });

    const { result } = renderHook(() => useMedia(emptyFilters()));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('hasMore is true when any bundle has a nextUrl', async () => {
    vi.spyOn(jsonapi, 'fetchMediaFirstPage').mockResolvedValue({
      items: [makeItem('1')],
      nextUrls: { ...emptyNextUrls, image: 'http://example.com/jsonapi/media/image?page[offset]=24' },
    });

    const { result } = renderHook(() => useMedia(emptyFilters()));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasMore).toBe(true);
  });

  it('loadMore appends items and updates nextUrls', async () => {
    vi.spyOn(jsonapi, 'fetchMediaFirstPage').mockResolvedValue({
      items: [makeItem('1'), makeItem('2')],
      nextUrls: { ...emptyNextUrls, image: 'http://example.com/next' },
    });
    vi.spyOn(jsonapi, 'fetchMediaMorePages').mockResolvedValue({
      items: [makeItem('3'), makeItem('4')],
      nextUrls: emptyNextUrls,
    });

    const { result } = renderHook(() => useMedia(emptyFilters()));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(result.current.items).toHaveLength(4);
    expect(result.current.hasMore).toBe(false);
  });

  it('deduplicates items that appear on multiple pages', async () => {
    vi.spyOn(jsonapi, 'fetchMediaFirstPage').mockResolvedValue({
      items: [makeItem('1'), makeItem('2')],
      nextUrls: { ...emptyNextUrls, image: 'http://example.com/next' },
    });
    vi.spyOn(jsonapi, 'fetchMediaMorePages').mockResolvedValue({
      // item '2' is a duplicate
      items: [makeItem('2'), makeItem('3')],
      nextUrls: emptyNextUrls,
    });

    const { result } = renderHook(() => useMedia(emptyFilters()));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(result.current.items).toHaveLength(3);
    expect(result.current.items.map((i) => i.id)).toEqual(['1', '2', '3']);
  });

  it('resets items and re-fetches when filters change', async () => {
    const spy = vi
      .spyOn(jsonapi, 'fetchMediaFirstPage')
      .mockResolvedValue({ items: [makeItem('1')], nextUrls: emptyNextUrls });

    const { result, rerender } = renderHook(
      ({ filters }) => useMedia(filters),
      { initialProps: { filters: emptyFilters() } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(spy).toHaveBeenCalledTimes(1);

    rerender({ filters: { ...emptyFilters(), categoryIds: new Set(['cat-1']) } });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0]).toMatchObject({ categoryIds: new Set(['cat-1']) });
  });

  it('surfaces an error when the API throws', async () => {
    vi.spyOn(jsonapi, 'fetchMediaFirstPage').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMedia(emptyFilters()));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.items).toHaveLength(0);
  });

  it('debounces search — fires a single API call after typing stops', async () => {
    vi.useFakeTimers();
    const spy = vi
      .spyOn(jsonapi, 'fetchMediaFirstPage')
      .mockResolvedValue({ items: [], nextUrls: emptyNextUrls });

    const { rerender } = renderHook(
      ({ filters }) => useMedia(filters),
      { initialProps: { filters: emptyFilters() } },
    );

    // Flush initial fetch
    await act(() => vi.runAllTimersAsync());
    expect(spy).toHaveBeenCalledTimes(1);

    // Simulate rapid typing
    rerender({ filters: { ...emptyFilters(), search: 'h' } });
    rerender({ filters: { ...emptyFilters(), search: 'he' } });
    rerender({ filters: { ...emptyFilters(), search: 'hello' } });

    // Debounce hasn't settled yet — no new call
    expect(spy).toHaveBeenCalledTimes(1);

    // Advance past the 350ms debounce
    await act(() => vi.runAllTimersAsync());
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0]).toMatchObject({ search: 'hello' });

    vi.useRealTimers();
  });
});
