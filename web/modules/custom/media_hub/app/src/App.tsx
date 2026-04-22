import { useState, useMemo } from 'react';
import { Hero } from './components/Hero';
import { FilterSidebar } from './components/FilterSidebar';
import { MediaGrid } from './components/MediaGrid';
import { Lightbox } from './components/Lightbox';
import { useMedia } from './hooks/useMedia';
import { emptyFilters } from './types/media';
import type { FilterState, MediaItem } from './types/media';

const QUICK_ACCESS: { label: string; categoryName: string }[] = [
  { label: 'Brand Assets', categoryName: 'Brand Assets' },
  { label: 'Events', categoryName: 'Events' },
  { label: 'People', categoryName: 'People' },
  { label: 'Sites', categoryName: 'Sites' },
];

export function App() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const { filteredItems, taxonomy, loading, error } = useMedia(filters);

  const categoryByName = useMemo(() => {
    const map = new Map<string, string>();
    taxonomy.categories.forEach((c) => map.set(c.name.toLowerCase(), c.id));
    return map;
  }, [taxonomy.categories]);

  function handleQuickAccess(categoryName: string) {
    const id = categoryByName.get(categoryName.toLowerCase());
    if (!id) return;
    setFilters((prev) => ({
      ...prev,
      categoryIds: new Set([id]),
    }));
  }

  function clearCategory() {
    setFilters((prev) => ({ ...prev, categoryIds: new Set() }));
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-red-500 font-medium mb-2">Failed to load media</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const totalItems = filteredItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero
        search={filters.search}
        onSearch={(s) => setFilters((prev) => ({ ...prev, search: s }))}
        total={loading ? 0 : totalItems}
        filtered={totalItems}
      />

      {/* Quick access strip */}
      {!loading && taxonomy.categories.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">
            Quick access:
          </span>
          {QUICK_ACCESS.map((qa) => {
            const id = categoryByName.get(qa.categoryName.toLowerCase());
            if (!id) return null;
            const active = filters.categoryIds.has(id);
            return (
              <button
                key={qa.label}
                type="button"
                onClick={() =>
                  active ? clearCategory() : handleQuickAccess(qa.categoryName)
                }
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  active
                    ? 'bg-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-navy hover:text-white'
                }`}
              >
                {qa.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6 p-6 max-w-screen-2xl mx-auto items-start">
        <FilterSidebar
          taxonomy={taxonomy}
          filters={filters}
          onFilterChange={setFilters}
          filteredCount={totalItems}
        />

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {loading ? 'Loading…' : `${totalItems} asset${totalItems !== 1 ? 's' : ''}`}
            </h2>
          </div>

          <MediaGrid
            items={filteredItems}
            categories={taxonomy.categories}
            onItemClick={setSelectedItem}
            loading={loading}
          />
        </main>
      </div>

      {selectedItem && (
        <Lightbox
          item={selectedItem}
          allItems={filteredItems}
          onClose={() => setSelectedItem(null)}
          onNavigate={setSelectedItem}
        />
      )}
    </div>
  );
}
