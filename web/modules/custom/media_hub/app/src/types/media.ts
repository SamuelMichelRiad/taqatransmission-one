export type MediaBundle = 'image' | 'video' | 'document' | 'audio' | 'remote_video';
export type Orientation = 'landscape' | 'portrait' | 'square';
export type ColorModel = 'rgb' | 'cmyk';
export type ResolutionPreset = 'sd' | 'hd' | 'fhd' | '4k';
export type DpiBucket = 'web' | 'medium' | 'print';
export type SizeBucket = 'small' | 'medium' | 'large';

export interface MediaItem {
  id: string;
  name: string;
  bundle: MediaBundle;
  thumbnailUrl: string;
  fullUrl: string;
  downloadUrl: string;
  caption: string;
  // Taxonomy IDs
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
  // Image technical metadata — from dedicated media entity fields
  imageOrientation?: Orientation;
  imageColorModel?: ColorModel;
  imageWidthPx?: number;
  imageHeightPx?: number;
  imageDpi?: number;
  watermarked?: boolean;
  // File metadata — from file entity, applies to all bundles
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
  // Taxonomy filters — sent to server
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
  // Technical filters — applied client-side after server fetch
  mediaType: Set<MediaBundle>;
  orientation: Set<Orientation>;
  colorModel: Set<ColorModel>;
  resolutionPreset: Set<ResolutionPreset>;
  dpi: Set<DpiBucket>;
  watermarked: Set<'yes' | 'no'>;
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
  // Technical facets
  bundles: Set<MediaBundle>;
  orientations: Set<Orientation>;
  colorModels: Set<ColorModel>;
  resolutionPresets: Set<ResolutionPreset>;
  dpiBuckets: Set<DpiBucket>;
  watermarkedValues: Set<'yes' | 'no'>;
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
    mediaType: new Set(),
    orientation: new Set(),
    colorModel: new Set(),
    resolutionPreset: new Set(),
    dpi: new Set(),
    watermarked: new Set(),
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
    bundles: new Set(),
    orientations: new Set(),
    colorModels: new Set(),
    resolutionPresets: new Set(),
    dpiBuckets: new Set(),
    watermarkedValues: new Set(),
    fileSizes: new Set(),
  };
}

export function isFiltered(f: FilterState): boolean {
  return (Object.keys(f) as Array<keyof FilterState>).some(
    (k) => k !== 'search' && (f[k] as Set<unknown>).size > 0,
  );
}

// ---- Technical bucketing helpers ----

export function itemOrientation(item: MediaItem): Orientation | null {
  return item.imageOrientation ?? null;
}

export function itemResolutionPreset(item: MediaItem): ResolutionPreset | null {
  if (!item.imageWidthPx) return null;
  if (item.imageWidthPx < 1280) return 'sd';
  if (item.imageWidthPx < 1920) return 'hd';
  if (item.imageWidthPx < 3840) return 'fhd';
  return '4k';
}

export function itemDpiBucket(item: MediaItem): DpiBucket | null {
  if (!item.imageDpi) return null;
  if (item.imageDpi <= 96) return 'web';
  if (item.imageDpi < 300) return 'medium';
  return 'print';
}

export function itemFileSize(item: MediaItem): SizeBucket | null {
  if (!item.filesize) return null;
  if (item.filesize < 1_000_000) return 'small';
  if (item.filesize <= 10_000_000) return 'medium';
  return 'large';
}
