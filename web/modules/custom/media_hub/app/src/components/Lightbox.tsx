import { useEffect, useRef } from 'react';
import type { MediaItem } from '../types/media';

interface LightboxProps {
  item: MediaItem;
  allItems: MediaItem[];
  onClose: () => void;
  onNavigate: (item: MediaItem) => void;
}

export function Lightbox({ item, allItems, onClose, onNavigate }: LightboxProps) {
  const currentIndex = allItems.findIndex((i) => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allItems.length - 1;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev)
        onNavigate(allItems[currentIndex - 1]);
      if (e.key === 'ArrowRight' && hasNext)
        onNavigate(allItems[currentIndex + 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate, allItems, currentIndex, hasPrev, hasNext]);

  function renderMedia() {
    if (item.bundle === 'video' || item.bundle === 'remote_video') {
      if (item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be')) {
        const videoId = extractYouTubeId(item.videoUrl);
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full aspect-video rounded-lg"
            allowFullScreen
            title={item.name}
          />
        );
      }
      if (item.videoUrl.includes('vimeo.com')) {
        const videoId = item.videoUrl.split('/').pop();
        return (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            className="w-full aspect-video rounded-lg"
            allowFullScreen
            title={item.name}
          />
        );
      }
      if (item.videoUrl) {
        return (
          <video
            src={item.videoUrl}
            controls
            className="w-full max-h-[70vh] rounded-lg"
          />
        );
      }
    }

    if (item.fullUrl) {
      return (
        <img
          src={item.fullUrl}
          alt={item.name}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      );
    }

    return (
      <div className="w-full aspect-video bg-navy/20 rounded-lg flex items-center justify-center text-gray-400">
        No preview available
      </div>
    );
  }

  const related = allItems
    .filter(
      (i) =>
        i.id !== item.id &&
        i.categoryIds.some((c) => item.categoryIds.includes(c)),
    )
    .slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      ref={dialogRef}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-navy text-lg leading-tight">{item.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(item.created).toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Media stage */}
          <div className="relative bg-gray-50 flex items-center justify-center px-6 py-6">
            {hasPrev && (
              <button
                type="button"
                onClick={() => onNavigate(allItems[currentIndex - 1])}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-navy/80 text-white flex items-center justify-center hover:bg-navy transition z-10"
                aria-label="Previous"
              >
                ‹
              </button>
            )}

            {renderMedia()}

            {hasNext && (
              <button
                type="button"
                onClick={() => onNavigate(allItems[currentIndex + 1])}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-navy/80 text-white flex items-center justify-center hover:bg-navy transition z-10"
                aria-label="Next"
              >
                ›
              </button>
            )}
          </div>

          {/* Caption + download */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-start justify-between gap-4">
            <div
              className="text-sm text-gray-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: item.caption }}
            />
            {item.downloadUrl && (
              <a
                href={item.downloadUrl}
                download
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition"
              >
                Download ↓
              </a>
            )}
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-xs font-bold text-navy uppercase tracking-wider mb-3">
                Related
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {related.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onNavigate(rel)}
                    className="shrink-0 w-20 h-14 rounded overflow-hidden border-2 border-transparent hover:border-orange transition"
                  >
                    {rel.thumbnailUrl ? (
                      <img
                        src={rel.thumbnailUrl}
                        alt={rel.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Counter */}
        <div className="px-6 py-2 border-t border-gray-100 text-xs text-gray-400 text-center shrink-0">
          {currentIndex + 1} / {allItems.length}
        </div>
      </div>
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^&?/]+)/,
  );
  return match?.[1] ?? '';
}
