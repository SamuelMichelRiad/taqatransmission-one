import { useState, useEffect } from 'react';
import { fetchTaxonomy } from '../api/jsonapi';
import type { TaxonomyData } from '../types/media';

const EMPTY: TaxonomyData = {
  categories: [],
  tags: [],
  licenses: [],
  locations: [],
  assetTypes: [],
  graphicalElements: [],
  peopleFeatured: [],
  publications: [],
  sites: [],
  solutionSegments: [],
  themes: [],
};

export function useTaxonomy(): { taxonomy: TaxonomyData; loading: boolean } {
  const [taxonomy, setTaxonomy] = useState<TaxonomyData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchTaxonomy('media_category'),
      fetchTaxonomy('media_tags'),
      fetchTaxonomy('media_license'),
      fetchTaxonomy('media_location'),
      fetchTaxonomy('media_asset_type'),
      fetchTaxonomy('media_graphical_element'),
      fetchTaxonomy('media_people_featured'),
      fetchTaxonomy('media_publication'),
      fetchTaxonomy('media_site'),
      fetchTaxonomy('media_solution_segment'),
      fetchTaxonomy('media_theme'),
    ])
      .then(([
        categories,
        tags,
        licenses,
        locations,
        assetTypes,
        graphicalElements,
        peopleFeatured,
        publications,
        sites,
        solutionSegments,
        themes,
      ]) => {
        if (cancelled) return;
        setTaxonomy({
          categories,
          tags,
          licenses,
          locations,
          assetTypes,
          graphicalElements,
          peopleFeatured,
          publications,
          sites,
          solutionSegments,
          themes,
        });
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
