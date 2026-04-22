import { useState, useMemo } from 'react';
import { Hero } from './components/Hero';
import { FilterSidebar } from './components/FilterSidebar';
import { MediaGrid } from './components/MediaGrid';
import { Lightbox } from './components/Lightbox';
import { useMedia } from './hooks/useMedia';
import { useTaxonomy } from './hooks/useTaxonomy';
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

  const { taxonomy } = useTaxonomy();
  const { items, loading, loadingMore, hasMore, loadMore, error, visibleIds } = useMedia(filters);

  const categoryByName = useMemo(() => {
    const map = new Map<string, string>();
    taxonomy.categories.forEach((c) => map.set(c.name.toLowerCase(), c.id));
    return map;
  }, [taxonomy.categories]);

  function handleQuickAccess(categoryName: string) {
    const id = categoryByName.get(categoryName.toLowerCase());
    if (!id) return;
    const alreadyActive = filters.categoryIds.has(id);
    setFilters((prev) => ({
      ...prev,
      categoryIds: alreadyActive ? new Set() : new Set([id]),
    }));
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero
        search={filters.search}
        onSearch={(s) => setFilters((prev) => ({ ...prev, search: s }))}
      />

      {/* Quick access strip */}
      {taxonomy.categories.length > 0 && (
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
                onClick={() => handleQuickAccess(qa.categoryName)}
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
          visibleIds={visibleIds}
          loading={loading}
          onFilterChange={setFilters}
        />

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {loading
                ? 'Loading…'
                : `${items.length} asset${items.length !== 1 ? 's' : ''}${hasMore ? '+' : ''}`}
            </p>
          </div>

          <MediaGrid
            items={items}
            categories={taxonomy.categories}
            onItemClick={setSelectedItem}
            loading={loading}
          />

          {/* Load more */}
          {!loading && hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-navy text-white font-medium rounded-lg hover:bg-navy-light transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </main>
      </div>

      {selectedItem && (
        <Lightbox
          item={selectedItem}
          allItems={items}
          onClose={() => setSelectedItem(null)}
          onNavigate={setSelectedItem}
        />
      )}
    </div>
  );
}
