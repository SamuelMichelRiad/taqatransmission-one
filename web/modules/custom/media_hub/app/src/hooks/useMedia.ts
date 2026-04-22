import { useState, useEffect, useMemo } from 'react';
import { fetchAllMedia, fetchTaxonomy } from '../api/jsonapi';
import type { MediaItem, TaxonomyData, FilterState } from '../types/media';

export interface UseMediaResult {
  items: MediaItem[];
  filteredItems: MediaItem[];
  taxonomy: TaxonomyData;
  loading: boolean;
  error: string | null;
}

export function useMedia(filters: FilterState): UseMediaResult {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyData>({
    categories: [],
    tags: [],
    licenses: [],
    locations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [mediaItems, categories, tags, licenses, locations] =
          await Promise.all([
            fetchAllMedia(),
            fetchTaxonomy('media_category'),
            fetchTaxonomy('media_tags'),
            fetchTaxonomy('media_license'),
            fetchTaxonomy('media_location'),
          ]);

        if (cancelled) return;
        setItems(mediaItems);
        setTaxonomy({ categories, tags, licenses, locations });
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load media');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        filters.search &&
        !item.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !item.caption.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.categoryIds.size > 0 &&
        !item.categoryIds.some((id) => filters.categoryIds.has(id))
      ) {
        return false;
      }
      if (
        filters.tagIds.size > 0 &&
        !item.tagIds.some((id) => filters.tagIds.has(id))
      ) {
        return false;
      }
      if (
        filters.licenseIds.size > 0 &&
        !item.licenseIds.some((id) => filters.licenseIds.has(id))
      ) {
        return false;
      }
      if (
        filters.locationIds.size > 0 &&
        !item.locationIds.some((id) => filters.locationIds.has(id))
      ) {
        return false;
      }
      return true;
    });
  }, [items, filters]);

  return { items, filteredItems, taxonomy, loading, error };
}
