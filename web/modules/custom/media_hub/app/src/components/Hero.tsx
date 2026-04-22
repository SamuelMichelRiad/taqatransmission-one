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
      {/* Dark overlay so text stays readable over the photo */}
      <div className="absolute inset-0 bg-navy/70" />
      <div className="absolute inset-y-0 right-0 w-1 bg-orange" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange opacity-60" />

      {/* Content aligned with the main layout container */}
      <div className="relative w-full max-w-screen-2xl mx-auto px-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-6">MEDIA HUB</h1>

        <div className="relative max-w-2xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-lg select-none pointer-events-none">
            &#128269;
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search media…"
            className="w-full pl-11 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-orange focus:bg-white/15 transition"
          />
        </div>
      </div>
    </div>
  );
}
