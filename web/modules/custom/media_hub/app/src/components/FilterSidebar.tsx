import { useState } from 'react';
import type { TaxonomyData, FilterState } from '../types/media';

interface FilterSidebarProps {
  taxonomy: TaxonomyData;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterGroupProps {
  label: string;
  terms: { id: string; name: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

function FilterGroup({ label, terms, selected, onToggle }: FilterGroupProps) {
  const [open, setOpen] = useState(true);

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
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      viewBox="0 0 10 8"
                      fill="none"
                    >
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

export function FilterSidebar({ taxonomy, filters, onFilterChange }: FilterSidebarProps) {
  function toggle(field: keyof Pick<FilterState, 'categoryIds' | 'tagIds' | 'licenseIds' | 'locationIds'>, id: string) {
    const current = new Set(filters[field]);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    onFilterChange({ ...filters, [field]: current });
  }

  const hasFilters =
    filters.categoryIds.size > 0 ||
    filters.tagIds.size > 0 ||
    filters.licenseIds.size > 0 ||
    filters.locationIds.size > 0;

  function clearAll() {
    onFilterChange({
      ...filters,
      categoryIds: new Set(),
      tagIds: new Set(),
      licenseIds: new Set(),
      locationIds: new Set(),
    });
  }

  return (
    <aside className="w-60 shrink-0 bg-navy self-start sticky top-4 rounded-lg overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-white font-bold text-sm uppercase tracking-wider">
          Filters
        </span>
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
        terms={taxonomy.categories}
        selected={filters.categoryIds}
        onToggle={(id) => toggle('categoryIds', id)}
      />
      <FilterGroup
        label="License"
        terms={taxonomy.licenses}
        selected={filters.licenseIds}
        onToggle={(id) => toggle('licenseIds', id)}
      />
      <FilterGroup
        label="Tags"
        terms={taxonomy.tags}
        selected={filters.tagIds}
        onToggle={(id) => toggle('tagIds', id)}
      />
      <FilterGroup
        label="Location"
        terms={taxonomy.locations}
        selected={filters.locationIds}
        onToggle={(id) => toggle('locationIds', id)}
      />
    </aside>
  );
}
