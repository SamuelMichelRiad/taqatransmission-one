interface HeroProps {
  search: string;
  onSearch: (value: string) => void;
}

export function Hero({ search, onSearch }: HeroProps) {
  return (
    <div
      className="w-full text-white relative overflow-hidden flex items-center"
      style={{
        backgroundImage: 'url(/modules/custom/media_hub/media-hub-banner.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        aspectRatio: '1920 / 549',
      }}
    >
      <div className="absolute inset-0 bg-navy/70" />
      <div className="absolute inset-y-0 right-0 w-1 bg-orange" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange opacity-60" />

      <div className="relative w-full max-w-screen-2xl mx-auto px-6">
        {/* !important overrides any Olivero h1 colour rules */}
        <h1
          className="text-5xl font-extrabold tracking-tight mb-6"
          style={{ color: '#ffffff' }}
        >
          MEDIA HUB
        </h1>

        <div className="relative">
          {/* SVG icon: fixed 20×20, won't bleed into placeholder text */}
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search media…"
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-orange focus:bg-white/15 transition"
          />
        </div>
      </div>
    </div>
  );
}
