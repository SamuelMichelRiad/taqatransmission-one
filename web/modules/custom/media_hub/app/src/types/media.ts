export type MediaBundle = 'image' | 'video' | 'document' | 'audio' | 'remote_video';

export interface MediaItem {
  id: string;
  name: string;
  bundle: MediaBundle;
  thumbnailUrl: string;
  fullUrl: string;
  downloadUrl: string;
  caption: string;
  categoryIds: string[];
  tagIds: string[];
  licenseIds: string[];
  locationIds: string[];
  created: string;
  videoUrl: string;
}

export interface TaxonomyTerm {
  id: string;
  name: string;
}

export interface TaxonomyData {
  categories: TaxonomyTerm[];
  tags: TaxonomyTerm[];
  licenses: TaxonomyTerm[];
  locations: TaxonomyTerm[];
  assetTypes: TaxonomyTerm[];
  graphicalElements: TaxonomyTerm[];
  peopleFeatured: TaxonomyTerm[];
  publications: TaxonomyTerm[];
  sites: TaxonomyTerm[];
  solutionSegments: TaxonomyTerm[];
  themes: TaxonomyTerm[];
}

export interface FilterState {
  search: string;
  categoryIds: Set<string>;
  tagIds: Set<string>;
  licenseIds: Set<string>;
  locationIds: Set<string>;
  assetTypeIds: Set<string>;
  graphicalElementIds: Set<string>;
  peopleFeaturedIds: Set<string>;
  publicationIds: Set<string>;
  siteIds: Set<string>;
  solutionSegmentIds: Set<string>;
  themeIds: Set<string>;
}

export function emptyFilters(): FilterState {
  return {
    search: '',
    categoryIds: new Set(),
    tagIds: new Set(),
    licenseIds: new Set(),
    locationIds: new Set(),
    assetTypeIds: new Set(),
    graphicalElementIds: new Set(),
    peopleFeaturedIds: new Set(),
    publicationIds: new Set(),
    siteIds: new Set(),
    solutionSegmentIds: new Set(),
    themeIds: new Set(),
  };
}

export function isFiltered(f: FilterState): boolean {
  return (
    f.search !== '' ||
    f.categoryIds.size > 0 ||
    f.tagIds.size > 0 ||
    f.licenseIds.size > 0 ||
    f.locationIds.size > 0 ||
    f.assetTypeIds.size > 0 ||
    f.graphicalElementIds.size > 0 ||
    f.peopleFeaturedIds.size > 0 ||
    f.publicationIds.size > 0 ||
    f.siteIds.size > 0 ||
    f.solutionSegmentIds.size > 0 ||
    f.themeIds.size > 0
  );
}
