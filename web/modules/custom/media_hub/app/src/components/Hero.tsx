interface HeroProps {
  search: string;
  onSearch: (value: string) => void;
  total: number;
  filtered: number;
}

export function Hero({ search, onSearch, total, filtered }: HeroProps) {
  return (
    <div className="w-full bg-navy text-white">
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #00093f 0%, #0a1a6e 100%)' }}
      >
        {/* Decorative orange stripe */}
        <div className="absolute inset-y-0 right-0 w-1 bg-orange" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange opacity-60" />

        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <p className="text-orange text-xs font-bold tracking-[0.25em] uppercase mb-3">
            Taqa Transmission
          </p>
          <h1 className="text-5xl font-extrabold tracking-tight mb-2">
            MEDIA HUB
          </h1>
          <p className="text-white/60 text-sm mb-8">
            {total > 0 ? `${total} assets available` : ''}
          </p>

          <div className="relative max-w-xl mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg select-none">
              &#128269;
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search media…"
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-orange focus:bg-white/15 transition"
            />
            {filtered < total && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-xs">
                {filtered} result{filtered !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
