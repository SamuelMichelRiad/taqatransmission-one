import type { MediaItem } from '../types/media';

interface MediaCardProps {
  item: MediaItem;
  categoryNames: Map<string, string>;
  onClick: (item: MediaItem) => void;
}

const BUNDLE_ICON: Record<string, string> = {
  video: '▶',
  remote_video: '▶',
  document: '📄',
  audio: '🎵',
  image: '',
};

export function MediaCard({ item, categoryNames, onClick }: MediaCardProps) {
  const icon = BUNDLE_ICON[item.bundle] ?? '';
  const firstCategory = item.categoryIds[0]
    ? (categoryNames.get(item.categoryIds[0]) ?? '')
    : '';

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="group w-full text-left bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-navy/10 text-4xl">
            {icon || '🖼'}
          </div>
        )}

        {icon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white text-xl">
              {icon}
            </div>
          </div>
        )}

        {firstCategory && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold bg-navy/80 text-white backdrop-blur-sm">
            {firstCategory}
          </span>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-navy transition-colors">
          {item.name}
        </p>
      </div>
    </button>
  );
}
