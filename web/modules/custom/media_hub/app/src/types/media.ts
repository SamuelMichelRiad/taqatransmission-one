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
}

export interface FilterState {
  search: string;
  categoryIds: Set<string>;
  tagIds: Set<string>;
  licenseIds: Set<string>;
  locationIds: Set<string>;
}

export function emptyFilters(): FilterState {
  return {
    search: '',
    categoryIds: new Set(),
    tagIds: new Set(),
    licenseIds: new Set(),
    locationIds: new Set(),
  };
}

export function isFiltered(f: FilterState): boolean {
  return (
    f.search !== '' ||
    f.categoryIds.size > 0 ||
    f.tagIds.size > 0 ||
    f.licenseIds.size > 0 ||
    f.locationIds.size > 0
  );
}
