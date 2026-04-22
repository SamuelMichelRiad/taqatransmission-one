import { useState, useEffect } from 'react';
import type { TaxonomyData, FilterState, VisibleIds, Orientation, SizeBucket } from '../types/media';

const STORAGE_KEY = 'media-hub-filter-open';

function readStoredOpen(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeStoredOpen(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — no-op
  }
}

interface FilterSidebarProps {
  taxonomy: TaxonomyData;
  filters: FilterState;
  visibleIds: VisibleIds;
  loading: boolean;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterGroupProps {
  label: string;
  terms: { id: string; name: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

function FilterGroup({ label, terms, selected, onToggle }: FilterGroupProps) {
  const [open, setOpen] = useState(() => {
    const stored = readStoredOpen();
    return stored[label] ?? true;
  });

  useEffect(() => {
    const stored = readStoredOpen();
    writeStoredOpen({ ...stored, [label]: open });
  }, [label, open]);

  if (terms.length === 0) return null;

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/90 uppercase tracking-wider hover:bg-white/5 transition"
      >
        <span>{label}</span>
        <span
          className="text-orange text-xs transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          {terms.map((term) => {
            const checked = selected.has(term.id);
            return (
              <label
                key={term.id}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                    checked
                      ? 'bg-orange border-orange'
                      : 'bg-transparent border-white/30 group-hover:border-orange/60'
                  }`}
                  onClick={() => onToggle(term.id)}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(term.id)}
                  className="sr-only"
                />
                <span
                  className={`text-sm transition ${
                    checked ? 'text-orange' : 'text-white/70 group-hover:text-white'
                  }`}
                >
                  {term.name}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

type IdFilterKey = keyof Pick<
  FilterState,
  | 'categoryIds'
  | 'tagIds'
  | 'licenseIds'
  | 'locationIds'
  | 'assetTypeIds'
  | 'graphicalElementIds'
  | 'peopleFeaturedIds'
  | 'publicationIds'
  | 'siteIds'
  | 'solutionSegmentIds'
  | 'themeIds'
>;

const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'square', label: 'Square' },
];

const IMAGE_SIZE_OPTIONS: { value: SizeBucket; label: string }[] = [
  { value: 'small', label: 'Small (< 2 MP)' },
  { value: 'medium', label: 'Medium (2–8 MP)' },
  { value: 'large', label: 'Large (> 8 MP)' },
];

const FILE_SIZE_OPTIONS: { value: SizeBucket; label: string }[] = [
  { value: 'small', label: 'Small (< 1 MB)' },
  { value: 'medium', label: 'Medium (1–10 MB)' },
  { value: 'large', label: 'Large (> 10 MB)' },
];

export function FilterSidebar({ taxonomy, filters, visibleIds, loading, onFilterChange }: FilterSidebarProps) {
  function toggle(field: IdFilterKey, id: string) {
    const current = new Set(filters[field]);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    onFilterChange({ ...filters, [field]: current });
  }

  function toggleTech(field: 'orientation' | 'imageSize' | 'fileSize', value: string) {
    const current = new Set(filters[field] as Set<string>);
    if (current.has(value)) current.delete(value);
    else current.add(value);
    onFilterChange({ ...filters, [field]: current });
  }

  const hasFilters = (Object.keys(filters) as Array<keyof FilterState>).some(
    (k) => k !== 'search' && (filters[k] as Set<string>).size > 0,
  );

  function clearAll() {
    onFilterChange({
      ...filters,
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
    });
  }

  // While loading, show all taxonomy terms so the sidebar isn't empty.
  // Once loaded, restrict to terms present in the current result set
  // (always keeping selected terms visible so they can be deselected).
  function visibleTerms(
    terms: { id: string; name: string }[],
    available: Set<string>,
    selected: Set<string>,
  ): { id: string; name: string }[] {
    if (loading) return terms;
    return terms.filter((t) => available.has(t.id) || selected.has(t.id));
  }

  return (
    <aside className="w-60 shrink-0 bg-navy self-start sticky top-4 rounded-lg overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-white font-bold text-sm uppercase tracking-wider">Filters</span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-orange text-xs hover:text-orange-hover transition"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterGroup
        label="Category"
        terms={visibleTerms(taxonomy.categories, visibleIds.categoryIds, filters.categoryIds)}
        selected={filters.categoryIds}
        onToggle={(id) => toggle('categoryIds', id)}
      />
      <FilterGroup
        label="Asset Type"
        terms={visibleTerms(taxonomy.assetTypes, visibleIds.assetTypeIds, filters.assetTypeIds)}
        selected={filters.assetTypeIds}
        onToggle={(id) => toggle('assetTypeIds', id)}
      />
      <FilterGroup
        label="Theme"
        terms={visibleTerms(taxonomy.themes, visibleIds.themeIds, filters.themeIds)}
        selected={filters.themeIds}
        onToggle={(id) => toggle('themeIds', id)}
      />
      <FilterGroup
        label="People"
        terms={visibleTerms(taxonomy.peopleFeatured, visibleIds.peopleFeaturedIds, filters.peopleFeaturedIds)}
        selected={filters.peopleFeaturedIds}
        onToggle={(id) => toggle('peopleFeaturedIds', id)}
      />
      <FilterGroup
        label="Site"
        terms={visibleTerms(taxonomy.sites, visibleIds.siteIds, filters.siteIds)}
        selected={filters.siteIds}
        onToggle={(id) => toggle('siteIds', id)}
      />
      <FilterGroup
        label="Solution Segment"
        terms={visibleTerms(taxonomy.solutionSegments, visibleIds.solutionSegmentIds, filters.solutionSegmentIds)}
        selected={filters.solutionSegmentIds}
        onToggle={(id) => toggle('solutionSegmentIds', id)}
      />
      <FilterGroup
        label="Publication"
        terms={visibleTerms(taxonomy.publications, visibleIds.publicationIds, filters.publicationIds)}
        selected={filters.publicationIds}
        onToggle={(id) => toggle('publicationIds', id)}
      />
      <FilterGroup
        label="Graphical Element"
        terms={visibleTerms(taxonomy.graphicalElements, visibleIds.graphicalElementIds, filters.graphicalElementIds)}
        selected={filters.graphicalElementIds}
        onToggle={(id) => toggle('graphicalElementIds', id)}
      />
      <FilterGroup
        label="License"
        terms={visibleTerms(taxonomy.licenses, visibleIds.licenseIds, filters.licenseIds)}
        selected={filters.licenseIds}
        onToggle={(id) => toggle('licenseIds', id)}
      />
      <FilterGroup
        label="Tags"
        terms={visibleTerms(taxonomy.tags, visibleIds.tagIds, filters.tagIds)}
        selected={filters.tagIds}
        onToggle={(id) => toggle('tagIds', id)}
      />
      <FilterGroup
        label="Location"
        terms={visibleTerms(taxonomy.locations, visibleIds.locationIds, filters.locationIds)}
        selected={filters.locationIds}
        onToggle={(id) => toggle('locationIds', id)}
      />

      {/* Technical filters — derived from file metadata, applied client-side */}
      <FilterGroup
        label="Orientation"
        terms={ORIENTATION_OPTIONS
          .filter((o) => visibleIds.orientations.has(o.value) || filters.orientation.has(o.value))
          .map((o) => ({ id: o.value, name: o.label }))}
        selected={filters.orientation as Set<string>}
        onToggle={(v) => toggleTech('orientation', v)}
      />
      <FilterGroup
        label="Image Size"
        terms={IMAGE_SIZE_OPTIONS
          .filter((o) => visibleIds.imageSizes.has(o.value) || filters.imageSize.has(o.value))
          .map((o) => ({ id: o.value, name: o.label }))}
        selected={filters.imageSize as Set<string>}
        onToggle={(v) => toggleTech('imageSize', v)}
      />
      <FilterGroup
        label="File Size"
        terms={FILE_SIZE_OPTIONS
          .filter((o) => visibleIds.fileSizes.has(o.value) || filters.fileSize.has(o.value))
          .map((o) => ({ id: o.value, name: o.label }))}
        selected={filters.fileSize as Set<string>}
        onToggle={(v) => toggleTech('fileSize', v)}
      />
    </aside>
  );
}
