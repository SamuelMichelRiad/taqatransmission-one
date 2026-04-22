import type { MediaItem, TaxonomyTerm } from '../types/media';

let basePath = '/';
export function setBasePath(path: string): void {
  basePath = path;
}
function api(path: string): string {
  return `${basePath}jsonapi/${path}`;
}

// Handle both standard JSON:API (item.attributes.key) and the flattened structure
// used on this Drupal site (item.key at root level).
export function resolveField<T>(item: Record<string, unknown>, key: string): T | undefined {
  const attrs = item['attributes'] as Record<string, unknown> | undefined;
  return (attrs?.[key] ?? item[key]) as T | undefined;
}

function resolveRefArray(
  item: Record<string, unknown>,
  field: string,
): Array<{ id: string }> {
  const val = resolveField<unknown>(item, field);
  if (!val) return [];
  if (Array.isArray(val)) return val as Array<{ id: string }>;
  // standard JSON:API: { data: [...] }
  const data = (val as Record<string, unknown>)['data'];
  if (Array.isArray(data)) return data as Array<{ id: string }>;
  return [];
}

function resolveRefSingle(
  item: Record<string, unknown>,
  field: string,
): { id: string } | null {
  const val = resolveField<unknown>(item, field);
  if (!val) return null;
  if (typeof val === 'object' && 'id' in (val as object))
    return val as { id: string };
  // standard JSON:API: { data: { id: ... } }
  const data = (val as Record<string, unknown>)['data'];
  if (data && typeof data === 'object' && 'id' in (data as object))
    return data as { id: string };
  return null;
}

function buildFileMap(included: Record<string, unknown>[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const inc of included) {
    if (inc['type'] === 'file--file') {
      const uri = resolveField<{ url?: string }>(inc, 'uri');
      if (uri?.url) map.set(inc['id'] as string, uri.url);
    }
  }
  return map;
}

function parseMediaItem(
  raw: Record<string, unknown>,
  fileMap: Map<string, string>,
): MediaItem {
  const bundle = (raw['type'] as string).replace('media--', '') as MediaItem['bundle'];

  const thumbnailRef = resolveRefSingle(raw, 'thumbnail');
  const imageRef = resolveRefSingle(raw, 'field_media_image');
  const videoFileRef = resolveRefSingle(raw, 'field_media_video_file');

  const thumbnailUrl = thumbnailRef ? (fileMap.get(thumbnailRef.id) ?? '') : '';
  const fullUrl = imageRef
    ? (fileMap.get(imageRef.id) ?? thumbnailUrl)
    : thumbnailUrl;
  const videoFileUrl = videoFileRef ? (fileMap.get(videoFileRef.id) ?? '') : '';

  const oembedVal = resolveField<string>(raw, 'field_media_oembed_video');
  const videoUrl = videoFileUrl || (typeof oembedVal === 'string' ? oembedVal : '');

  const captionRaw = resolveField<{ processed?: string; value?: string }>(
    raw,
    'field_media_caption',
  );
  const caption = captionRaw?.processed ?? captionRaw?.value ?? '';

  return {
    id: raw['id'] as string,
    name: (resolveField<string>(raw, 'name') ?? raw['name'] ?? '') as string,
    bundle,
    thumbnailUrl,
    fullUrl,
    downloadUrl: fullUrl || videoFileUrl,
    caption,
    categoryIds: resolveRefArray(raw, 'field_media_category').map((r) => r.id),
    tagIds: resolveRefArray(raw, 'field_media_tags').map((r) => r.id),
    licenseIds: resolveRefArray(raw, 'field_media_license').map((r) => r.id),
    locationIds: resolveRefArray(raw, 'field_media_location').map((r) => r.id),
    created: (resolveField<string>(raw, 'created') ?? '') as string,
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

const MEDIA_BUNDLES = Object.keys(BUNDLE_INCLUDES) as Array<keyof typeof BUNDLE_INCLUDES>;

export async function fetchAllMedia(): Promise<MediaItem[]> {
  const allItems: MediaItem[] = [];

  await Promise.all(
    MEDIA_BUNDLES.map(async (bundle) => {
      const includes = BUNDLE_INCLUDES[bundle];
      let url: string | null =
        api(`media/${bundle}`) +
        `?include=${includes}&page[limit]=100&sort=-created`;

      while (url) {
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 404) return; // bundle doesn't exist on this site
          throw new Error(`Failed to fetch ${bundle}: ${res.status}`);
        }
        const data = (await res.json()) as {
          data: Record<string, unknown>[];
          included?: Record<string, unknown>[];
          links?: { next?: { href: string } };
        };

        const fileMap = buildFileMap(data.included ?? []);
        for (const raw of data.data) {
          allItems.push(parseMediaItem(raw, fileMap));
        }

        url = data.links?.next?.href ?? null;
      }
    }),
  );

  return allItems;
}

export async function fetchTaxonomy(vocab: string): Promise<TaxonomyTerm[]> {
  let url: string | null =
    api(`taxonomy_term/${vocab}`) + '?page[limit]=100&sort=name';
  const terms: TaxonomyTerm[] = [];

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
