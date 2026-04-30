import { useState, useMemo } from 'react';
import { Hero } from './components/Hero';
import { FilterSidebar } from './components/FilterSidebar';
import { MediaGrid } from './components/MediaGrid';
import { Lightbox } from './components/Lightbox';
import { FeaturedSection } from './components/FeaturedSection';
import { useMedia } from './hooks/useMedia';
import { useTaxonomy } from './hooks/useTaxonomy';
import { emptyFilters } from './types/media';
import type { FilterState, MediaItem } from './types/media';

// Placeholder colours until real background images are provided.
const QUICK_ACCESS_PLACEHOLDER_COLORS: Record<string, string> = {
  'Brand Assets': 'linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)',
  Events: 'linear-gradient(135deg, #4a1a2e 0%, #6b2d4a 100%)',
  People: 'linear-gradient(135deg, #1a4a2e 0%, #2d6b4a 100%)',
  Sites: 'linear-gradient(135deg, #4a3a1a 0%, #6b5a2d 100%)',
};

const QUICK_ACCESS: { label: string; categoryName: string; image?: string }[] = [
  { label: 'Brand Assets', categoryName: 'Brand Assets' },
  { label: 'Events', categoryName: 'Events' },
  { label: 'People', categoryName: 'People' },
  { label: 'Sites', categoryName: 'Sites' },
];

export function App() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const { taxonomy } = useTaxonomy();
  const { items, featuredItems, loading, loadingMore, hasMore, loadMore, error, visibleIds } = useMedia(filters);

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
      <Hero />

      {/* Featured section */}
      <FeaturedSection items={featuredItems} onItemClick={setSelectedItem} />

      {/* Main layout */}
      <div className="flex gap-6 p-6 max-w-screen-2xl mx-auto items-start">
        <FilterSidebar
          taxonomy={taxonomy}
          filters={filters}
          visibleIds={visibleIds}
          loading={loading}
          onFilterChange={setFilters}
          search={filters.search}
          onSearch={(s) => setFilters((prev) => ({ ...prev, search: s }))}
        />

        <main className="flex-1 min-w-0">
          {/* Quick access tiles */}
          {taxonomy.categories.length > 0 && (
            <div className="flex gap-3 flex-wrap mb-5">
              {QUICK_ACCESS.map((qa) => {
                const id = categoryByName.get(qa.categoryName.toLowerCase());
                if (!id) return null;
                const active = filters.categoryIds.has(id);
                const bg = qa.image
                  ? `url(${qa.image})`
                  : QUICK_ACCESS_PLACEHOLDER_COLORS[qa.label] ?? 'linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)';
                return (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => handleQuickAccess(qa.categoryName)}
                    className={`shrink-0 relative rounded-xl overflow-hidden transition shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                      active ? 'ring-2 ring-orange' : ''
                    }`}
                    style={{
                      width: 140,
                      height: 88,
                      background: bg,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/30 hover:bg-black/20 transition" />
                    <span className="absolute inset-0 flex items-end p-2.5 text-white text-sm font-semibold leading-tight">
                      {qa.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

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
