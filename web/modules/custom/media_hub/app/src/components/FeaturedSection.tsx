import type { MediaItem } from '../types/media';

interface FeaturedSectionProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
}

export function FeaturedSection({ items, onItemClick }: FeaturedSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="px-6 py-5 max-w-screen-2xl mx-auto">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Suggestions For You
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick(item)}
            className="shrink-0 snap-start relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            style={{ width: 340, aspectRatio: '16 / 9' }}
          >
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-navy" />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* Featured badge */}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange text-white">
              Featured
            </span>
            {/* Title */}
            <p className="absolute bottom-0 left-0 right-0 px-3 py-2.5 text-white text-sm font-semibold leading-snug line-clamp-2">
              {item.name}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
