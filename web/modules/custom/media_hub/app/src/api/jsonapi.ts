import type { MediaItem, FilterState } from '../types/media';

export const PAGE_SIZE = 24;

let basePath = '/';
export function setBasePath(path: string): void {
  basePath = path;
}
function api(path: string): string {
  return `${basePath}jsonapi/${path}`;
}

// Handle both standard JSON:API (item.attributes.key) and the flattened
// structure used on this Drupal site (fields at root level of each item).
export function resolveField<T>(item: Record<string, unknown>, key: string): T | undefined {
  const attrs = item['attributes'] as Record<string, unknown> | undefined;
  return (attrs?.[key] ?? item[key]) as T | undefined;
}

function resolveRefArray(item: Record<string, unknown>, field: string): Array<{ id: string }> {
  const val = resolveField<unknown>(item, field);
  if (!val) return [];
  if (Array.isArray(val)) return val as Array<{ id: string }>;
  const data = (val as Record<string, unknown>)['data'];
  if (Array.isArray(data)) return data as Array<{ id: string }>;
  return [];
}

function resolveRefSingle(item: Record<string, unknown>, field: string): { id: string } | null {
  const val = resolveField<unknown>(item, field);
  if (!val || typeof val !== 'object') return null;
  const obj = val as Record<string, unknown>;
  // Flattened: { type, id, meta, ... }
  if (typeof obj['id'] === 'string') return obj as { id: string };
  // Standard JSON:API: { data: { type, id, meta } }
  const data = obj['data'] as Record<string, unknown> | undefined;
  if (data && typeof data['id'] === 'string') return data as { id: string };
  return null;
}

function buildFileMap(included: Record<string, unknown>[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const inc of included) {
    if (inc['type'] !== 'file--file') continue;
    const id = inc['id'] as string | undefined;
    if (!id) continue;
    // Try both standard (attributes.uri.url) and flattened (uri.url)
    const uri = resolveField<{ url?: string }>(inc, 'uri');
    if (uri?.url) map.set(id, uri.url);
  }
  return map;
}

// Fallback: batch-fetch file entities by UUID when `include` didn't yield URLs.
async function fetchFileUrlsByIds(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const params = new URLSearchParams();
  params.set('filter[ids][condition][path]', 'id');
  params.set('filter[ids][condition][operator]', 'IN');
  ids.forEach((id, i) => params.append(`filter[ids][condition][value][${i}]`, id));

  try {
    const res = await fetch(`${api('file/file')}?${params}`);
    if (!res.ok) return map;
    const data = (await res.json()) as { data: Record<string, unknown>[] };
    for (const item of data.data) {
      const uri = resolveField<{ url?: string }>(item, 'uri');
      if (uri?.url) map.set(item['id'] as string, uri.url);
    }
  } catch {
    // non-fatal
  }
  return map;
}

function parseMediaItem(raw: Record<string, unknown>, fileMap: Map<string, string>): MediaItem {
  const bundle = (raw['type'] as string).replace('media--', '') as MediaItem['bundle'];

  const thumbnailRef = resolveRefSingle(raw, 'thumbnail');
  const imageRef = resolveRefSingle(raw, 'field_media_image');
  const videoFileRef = resolveRefSingle(raw, 'field_media_video_file');

  const thumbnailUrl = thumbnailRef ? (fileMap.get(thumbnailRef.id) ?? '') : '';
  const fullUrl = imageRef ? (fileMap.get(imageRef.id) ?? thumbnailUrl) : thumbnailUrl;
  const videoFileUrl = videoFileRef ? (fileMap.get(videoFileRef.id) ?? '') : '';

  const oembedVal = resolveField<string>(raw, 'field_media_oembed_video');
  const videoUrl = videoFileUrl || (typeof oembedVal === 'string' ? oembedVal : '');

  const captionRaw = resolveField<{ processed?: string; value?: string }>(raw, 'field_media_caption');
  const caption = captionRaw?.processed ?? captionRaw?.value ?? '';

  return {
    id: raw['id'] as string,
    name: (resolveField<string>(raw, 'name') ?? (raw['name'] as string) ?? '') as string,
    bundle,
    thumbnailUrl,
    fullUrl,
    downloadUrl: fullUrl || videoFileUrl,
    caption,
    categoryIds: resolveRefArray(raw, 'field_media_category').map((r) => r.id),
    tagIds: resolveRefArray(raw, 'field_media_tags').map((r) => r.id),
    licenseIds: resolveRefArray(raw, 'field_media_license').map((r) => r.id),
    locationIds: resolveRefArray(raw, 'field_media_location').map((r) => r.id),
    created: (resolveField<string>(raw, 'created') ?? (raw['created'] as string) ?? '') as string,
    videoUrl,
  };
}

const BUNDLE_INCLUDES: Record<string, string> = {
  image: 'thumbnail,field_media_image',
  video: 'thumbnail,field_media_video_file',
  remote_video: 'thumbnail',
  document: 'thumbnail,field_media_document,field_media_file',
  audio: 'thumbnail,field_media_audio_file,field_media_file',
};

const MEDIA_BUNDLES = Object.keys(BUNDLE_INCLUDES);

// Build JSON:API server-side filter params from FilterState.
export function buildFilterParams(filters: FilterState): URLSearchParams {
  const p = new URLSearchParams();

  if (filters.search.trim()) {
    p.set('filter[search][condition][path]', 'name');
    p.set('filter[search][condition][operator]', 'CONTAINS');
    p.set('filter[search][condition][value]', filters.search.trim());
  }

  appendIdsFilter(p, 'cats',   'field_media_category.id',        filters.categoryIds);
  appendIdsFilter(p, 'tags',   'field_media_tags.id',             filters.tagIds);
  appendIdsFilter(p, 'lic',    'field_media_license.id',          filters.licenseIds);
  appendIdsFilter(p, 'loc',    'field_media_location.id',         filters.locationIds);
  appendIdsFilter(p, 'astype', 'field_media_asset_type.id',       filters.assetTypeIds);
  appendIdsFilter(p, 'gfx',    'field_image_graphical_element.id',filters.graphicalElementIds);
  appendIdsFilter(p, 'ppl',    'field_media_people_featured.id',  filters.peopleFeaturedIds);
  appendIdsFilter(p, 'pub',    'field_media_publication.id',      filters.publicationIds);
  appendIdsFilter(p, 'site',   'field_media_site.id',             filters.siteIds);
  appendIdsFilter(p, 'seg',    'field_media_solution_segment.id', filters.solutionSegmentIds);
  appendIdsFilter(p, 'theme',  'field_media_theme.id',            filters.themeIds);

  return p;
}

function appendIdsFilter(
  p: URLSearchParams,
  key: string,
  path: string,
  ids: Set<string>,
): void {
  if (ids.size === 0) return;
  p.set(`filter[${key}][condition][path]`, path);
  p.set(`filter[${key}][condition][operator]`, ids.size === 1 ? '=' : 'IN');
  if (ids.size === 1) {
    p.set(`filter[${key}][condition][value]`, [...ids][0]);
  } else {
    let i = 0;
    for (const id of ids) {
      p.append(`filter[${key}][condition][value][${i}]`, id);
      i++;
    }
  }
}

interface BundlePageResult {
  items: MediaItem[];
  nextUrl: string | null;
}

async function fetchBundlePage(
  bundle: string,
  filterParams: URLSearchParams,
  pageUrl?: string, // pass Drupal's links.next URL directly for subsequent pages
): Promise<BundlePageResult> {
  const includes = BUNDLE_INCLUDES[bundle] ?? 'thumbnail';

  const fetchUrl =
    pageUrl ??
    (() => {
      const params = new URLSearchParams(filterParams);
      params.set('include', includes);
      params.set('page[limit]', String(PAGE_SIZE));
      params.set('sort', '-created');
      return `${api(`media/${bundle}`)}?${params}`;
    })();

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    // 404 = bundle doesn't exist; 400 = a filter field doesn't exist on this bundle.
    // Both mean zero results for this bundle — not a fatal error.
    if (res.status === 404 || res.status === 400) return { items: [], nextUrl: null };
    throw new Error(`Failed to fetch ${bundle}: ${res.status}`);
  }

  const data = (await res.json()) as {
    data: Record<string, unknown>[];
    included?: Record<string, unknown>[];
    links?: { next?: { href: string } };
  };

  const fileMap = buildFileMap(data.included ?? []);

  // Collect file IDs not resolved via include — batch-fetch as fallback.
  const unresolvedIds = new Set<string>();
  for (const raw of data.data) {
    for (const field of ['thumbnail', 'field_media_image', 'field_media_video_file']) {
      const ref = resolveRefSingle(raw, field);
      if (ref && !fileMap.has(ref.id)) unresolvedIds.add(ref.id);
    }
  }
  if (unresolvedIds.size > 0) {
    const fallback = await fetchFileUrlsByIds([...unresolvedIds]);
    fallback.forEach((url, id) => fileMap.set(id, url));
  }

  return {
    items: data.data.map((raw) => parseMediaItem(raw, fileMap)),
    nextUrl: data.links?.next?.href ?? null,
  };
}

export interface MediaPageResult {
  items: MediaItem[];
  // Per-bundle next-page URLs; null means that bundle is exhausted.
  nextUrls: Record<string, string | null>;
}

export async function fetchMediaFirstPage(filters: FilterState): Promise<MediaPageResult> {
  const filterParams = buildFilterParams(filters);

  const results = await Promise.all(
    MEDIA_BUNDLES.map((bundle) =>
      fetchBundlePage(bundle, filterParams).then((r) => ({ bundle, ...r })),
    ),
  );

  const nextUrls: Record<string, string | null> = {};
  for (const r of results) nextUrls[r.bundle] = r.nextUrl;

  return {
    items: sortByDate(results.flatMap((r) => r.items)),
    nextUrls,
  };
}

// Uses the per-bundle nextUrls returned by fetchMediaFirstPage / previous fetchMediaMorePages.
export async function fetchMediaMorePages(
  nextUrls: Record<string, string | null>,
): Promise<MediaPageResult> {
  const results = await Promise.all(
    MEDIA_BUNDLES.map(async (bundle) => {
      const url = nextUrls[bundle];
      if (!url) return { bundle, items: [] as MediaItem[], nextUrl: null };
      return fetchBundlePage(bundle, new URLSearchParams(), url).then((r) => ({
        bundle,
        ...r,
      }));
    }),
  );

  const newNextUrls: Record<string, string | null> = {};
  for (const r of results) newNextUrls[r.bundle] = r.nextUrl;

  return {
    items: sortByDate(results.flatMap((r) => r.items)),
    nextUrls: newNextUrls,
  };
}

function sortByDate(items: MediaItem[]): MediaItem[] {
  return [...items].sort((a, b) => b.created.localeCompare(a.created));
}

export async function fetchTaxonomy(vocab: string): Promise<Array<{ id: string; name: string }>> {
  let url: string | null = api(`taxonomy_term/${vocab}`) + '?page[limit]=100&sort=name';
  const terms: Array<{ id: string; name: string }> = [];

  while (url) {
    const res = await fetch(url);
    if (!res.ok) return terms;
    const data = (await res.json()) as {
      data: Record<string, unknown>[];
      links?: { next?: { href: string } };
    };

    for (const item of data.data) {
      const name = resolveField<string>(item, 'name') ?? (item['name'] as string);
      if (name) terms.push({ id: item['id'] as string, name });
    }

    url = data.links?.next?.href ?? null;
  }

  return terms;
}
