import type { MediaItem, TaxonomyTerm } from '../types/media';
import { MediaCard } from './MediaCard';

interface MediaGridProps {
  items: MediaItem[];
  categories: TaxonomyTerm[];
  onItemClick: (item: MediaItem) => void;
  loading: boolean;
}

export function MediaGrid({ items, categories, onItemClick, loading }: MediaGridProps) {
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl overflow-hidden shadow animate-pulse"
          >
            <div className="aspect-video bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-lg font-medium">No media found</p>
        <p className="text-sm mt-1">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          categoryNames={categoryNames}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}
