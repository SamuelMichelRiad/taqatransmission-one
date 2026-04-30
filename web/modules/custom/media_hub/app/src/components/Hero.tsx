export function Hero() {
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
        <h1
          className="text-5xl font-extrabold tracking-tight"
          style={{ color: '#ffffff' }}
        >
          MEDIA HUB
        </h1>
      </div>
    </div>
  );
}
