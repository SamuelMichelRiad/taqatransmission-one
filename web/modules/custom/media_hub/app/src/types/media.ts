export type MediaBundle = 'image' | 'video' | 'document' | 'audio' | 'remote_video';
export type Orientation = 'landscape' | 'portrait' | 'square';
export type SizeBucket = 'small' | 'medium' | 'large';

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
  assetTypeIds: string[];
  graphicalElementIds: string[];
  peopleFeaturedIds: string[];
  publicationIds: string[];
  siteIds: string[];
  solutionSegmentIds: string[];
  themeIds: string[];
  created: string;
  videoUrl: string;
  width?: number;
  height?: number;
  filesize?: number;
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
  // Applied client-side after server fetch
  orientation: Set<Orientation>;
  imageSize: Set<SizeBucket>;
  fileSize: Set<SizeBucket>;
}

export interface VisibleIds {
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
  orientations: Set<Orientation>;
  imageSizes: Set<SizeBucket>;
  fileSizes: Set<SizeBucket>;
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
    orientation: new Set(),
    imageSize: new Set(),
    fileSize: new Set(),
  };
}

export function emptyVisibleIds(): VisibleIds {
  return {
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
    orientations: new Set(),
    imageSizes: new Set(),
    fileSizes: new Set(),
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
    f.themeIds.size > 0 ||
    f.orientation.size > 0 ||
    f.imageSize.size > 0 ||
    f.fileSize.size > 0
  );
}

export function itemOrientation(item: MediaItem): Orientation | null {
  if (item.bundle !== 'image' || !item.width || !item.height) return null;
  const ratio = item.width / item.height;
  if (ratio > 1.05) return 'landscape';
  if (ratio < 0.95) return 'portrait';
  return 'square';
}

export function itemImageSize(item: MediaItem): SizeBucket | null {
  if (item.bundle !== 'image' || !item.width || !item.height) return null;
  const mp = (item.width * item.height) / 1_000_000;
  if (mp < 2) return 'small';
  if (mp <= 8) return 'medium';
  return 'large';
}

export function itemFileSize(item: MediaItem): SizeBucket | null {
  if (!item.filesize) return null;
  if (item.filesize < 1_000_000) return 'small';
  if (item.filesize <= 10_000_000) return 'medium';
  return 'large';
}
