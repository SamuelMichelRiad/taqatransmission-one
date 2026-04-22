import { useState, useEffect } from 'react';
import { fetchTaxonomy } from '../api/jsonapi';
import type { TaxonomyData } from '../types/media';

export function useTaxonomy(): { taxonomy: TaxonomyData; loading: boolean } {
  const [taxonomy, setTaxonomy] = useState<TaxonomyData>({
    categories: [],
    tags: [],
    licenses: [],
    locations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchTaxonomy('media_category'),
      fetchTaxonomy('media_tags'),
      fetchTaxonomy('media_license'),
      fetchTaxonomy('media_location'),
    ])
      .then(([categories, tags, licenses, locations]) => {
        if (cancelled) return;
        setTaxonomy({ categories, tags, licenses, locations });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { taxonomy, loading };
}
