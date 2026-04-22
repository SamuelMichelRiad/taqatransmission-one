import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchMediaFirstPage, fetchMediaMorePages } from '../api/jsonapi';
import type { FilterState, MediaItem, VisibleIds } from '../types/media';
import {
  emptyVisibleIds,
  itemOrientation,
  itemResolutionPreset,
  itemDpiBucket,
  itemFileSize,
} from '../types/media';

export interface UseMediaResult {
  items: MediaItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  visibleIds: VisibleIds;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Stable key for the server-side filters (search + all taxonomy Sets).
// Technical filters are client-side only and must NOT be included here.
function serverFiltersKey(filters: FilterState): string {
  return JSON.stringify({
    s: filters.search,
    c: [...filters.categoryIds].sort(),
    t: [...filters.tagIds].sort(),
    l: [...filters.licenseIds].sort(),
    lo: [...filters.locationIds].sort(),
    at: [...filters.assetTypeIds].sort(),
    ge: [...filters.graphicalElementIds].sort(),
    pf: [...filters.peopleFeaturedIds].sort(),
    pb: [...filters.publicationIds].sort(),
    si: [...filters.siteIds].sort(),
    ss: [...filters.solutionSegmentIds].sort(),
    th: [...filters.themeIds].sort(),
  });
}

function technicalFiltersKey(filters: FilterState): string {
  return JSON.stringify({
    mt: [...filters.mediaType].sort(),
    o: [...filters.orientation].sort(),
    cm: [...filters.colorModel].sort(),
    rp: [...filters.resolutionPreset].sort(),
    dp: [...filters.dpi].sort(),
    wm: [...filters.watermarked].sort(),
    fs: [...filters.fileSize].sort(),
  });
}

function applyTechnicalFilters(items: MediaItem[], filters: FilterState): MediaItem[] {
  let result = items;

  if (filters.mediaType.size > 0) {
    result = result.filter((item) => filters.mediaType.has(item.bundle));
  }

  if (filters.orientation.size > 0) {
    result = result.filter((item) => {
      const o = itemOrientation(item);
      return o !== null && filters.orientation.has(o);
    });
  }

  if (filters.colorModel.size > 0) {
    result = result.filter(
      (item) => item.imageColorModel !== undefined && filters.colorModel.has(item.imageColorModel),
    );
  }

  if (filters.resolutionPreset.size > 0) {
    result = result.filter((item) => {
      const rp = itemResolutionPreset(item);
      return rp !== null && filters.resolutionPreset.has(rp);
    });
  }

  if (filters.dpi.size > 0) {
    result = result.filter((item) => {
      const d = itemDpiBucket(item);
      return d !== null && filters.dpi.has(d);
    });
  }

  if (filters.watermarked.size > 0) {
    result = result.filter((item) => {
      if (item.watermarked === undefined) return false;
      return filters.watermarked.has(item.watermarked ? 'yes' : 'no');
    });
  }

  if (filters.fileSize.size > 0) {
    result = result.filter((item) => {
      const fs = itemFileSize(item);
      return fs !== null && filters.fileSize.has(fs);
    });
  }

  return result;
}

function computeVisibleIds(items: MediaItem[]): VisibleIds {
  const result = emptyVisibleIds();

  for (const item of items) {
    item.categoryIds.forEach((id) => result.categoryIds.add(id));
    item.tagIds.forEach((id) => result.tagIds.add(id));
    item.licenseIds.forEach((id) => result.licenseIds.add(id));
    item.locationIds.forEach((id) => result.locationIds.add(id));
    item.assetTypeIds.forEach((id) => result.assetTypeIds.add(id));
    item.graphicalElementIds.forEach((id) => result.graphicalElementIds.add(id));
    item.peopleFeaturedIds.forEach((id) => result.peopleFeaturedIds.add(id));
    item.publicationIds.forEach((id) => result.publicationIds.add(id));
    item.siteIds.forEach((id) => result.siteIds.add(id));
    item.solutionSegmentIds.forEach((id) => result.solutionSegmentIds.add(id));
    item.themeIds.forEach((id) => result.themeIds.add(id));

    result.bundles.add(item.bundle);

    const o = itemOrientation(item);
    if (o) result.orientations.add(o);

    if (item.imageColorModel) result.colorModels.add(item.imageColorModel);

    const rp = itemResolutionPreset(item);
    if (rp) result.resolutionPresets.add(rp);

    const dpi = itemDpiBucket(item);
    if (dpi) result.dpiBuckets.add(dpi);

    if (item.watermarked !== undefined) {
      result.watermarkedValues.add(item.watermarked ? 'yes' : 'no');
    }

    const fs = itemFileSize(item);
    if (fs) result.fileSizes.add(fs);
  }

  return result;
}

export function useMedia(filters: FilterState): UseMediaResult {
  const [rawItems, setRawItems] = useState<MediaItem[]>([]);
  const [nextUrls, setNextUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(filters.search, 350);
  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverFiltersKey({ ...filters, search: debouncedSearch })],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRawItems([]);
    setError(null);
    setNextUrls({});

    fetchMediaFirstPage(effectiveFilters)
      .then((result) => {
        if (cancelled) return;
        setRawItems(result.items);
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
    // effectiveFilters changes only when the memoized serverFiltersKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveFilters]);

  const hasMore = Object.values(nextUrls).some(Boolean);

  const nextUrlsRef = useRef(nextUrls);
  nextUrlsRef.current = nextUrls;

  function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    fetchMediaMorePages(nextUrlsRef.current)
      .then((result) => {
        setRawItems((prev) => dedupeByDate([...prev, ...result.items]));
        setNextUrls(result.nextUrls);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingMore(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => applyTechnicalFilters(rawItems, filters), [rawItems, technicalFiltersKey(filters)]);

  const visibleIds = useMemo(() => computeVisibleIds(rawItems), [rawItems]);

  return { items, loading, loadingMore, hasMore, error, loadMore, visibleIds };
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
