import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchMediaFirstPage, fetchMediaMorePages } from '../api/jsonapi';
import type { FilterState, MediaItem } from '../types/media';

export interface UseMediaResult {
  items: MediaItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Stable key for filters so useEffect fires only on real changes.
function filtersKey(filters: FilterState): string {
  return JSON.stringify({
    s: filters.search,
    c: [...filters.categoryIds].sort(),
    t: [...filters.tagIds].sort(),
    l: [...filters.licenseIds].sort(),
    lo: [...filters.locationIds].sort(),
  });
}

export function useMedia(filters: FilterState): UseMediaResult {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [nextUrls, setNextUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(filters.search, 350);
  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey({ ...filters, search: debouncedSearch })],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setError(null);
    setNextUrls({});

    fetchMediaFirstPage(effectiveFilters)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setNextUrls(result.nextUrls);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // effectiveFilters changes only when the memoized filtersKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveFilters]);

  const hasMore = Object.values(nextUrls).some(Boolean);

  // Keep a ref to avoid stale closure in loadMore
  const nextUrlsRef = useRef(nextUrls);
  nextUrlsRef.current = nextUrls;

  function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    fetchMediaMorePages(nextUrlsRef.current)
      .then((result) => {
        setItems((prev) => dedupeByDate([...prev, ...result.items]));
        setNextUrls(result.nextUrls);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingMore(false));
  }

  return { items, loading, loadingMore, hasMore, error, loadMore };
}

function dedupeByDate(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => b.created.localeCompare(a.created));
}
