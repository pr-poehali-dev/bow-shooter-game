import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { GALLERY_PHOTOS } from "./constants";

const GALLERY_ALTS = [
  "Пенная вечеринка в Новосибирске — гости веселятся в пене на открытой площадке",
  "Пенное шоу для детей в Новосибирске — дети играют в пене на дне рождения",
  "Аренда пенной пушки в Новосибирске — профессиональная установка в действии",
  "Гендер пати с цветной пеной в Новосибирске — раскрытие пола ребёнка",
  "Пенная дискотека в Новосибирске — корпоратив с пеной для взрослых",
];

const GallerySection = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const repeated = [...GALLERY_PHOTOS, ...GALLERY_PHOTOS, ...GALLERY_PHOTOS];

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((p) => p !== null ? (p + 1) % GALLERY_PHOTOS.length : null);
      if (e.key === "ArrowLeft") setLightbox((p) => p !== null ? (p - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length : null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 text-center mb-12">
        <span className="text-accent text-sm font-medium tracking-widest uppercase">Наши мероприятия</span>
        <h2 className="text-5xl font-display font-black mt-3 tracking-tighter">
          Галерея
        </h2>
      </div>

      <div className="relative w-full overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-4 w-max"
          style={{ animation: "gallery-scroll 30s linear infinite" }}
          onMouseEnter={() => { if (trackRef.current) trackRef.current.style.animationPlayState = "paused"; }}
          onMouseLeave={() => { if (trackRef.current) trackRef.current.style.animationPlayState = "running"; }}
        >
          {repeated.map((src, i) => (
            <div
              key={i}
              className="w-72 h-52 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer group relative"
              onClick={() => setLightbox(i % GALLERY_PHOTOS.length)}
            >
              <img
                src={src}
                alt={GALLERY_ALTS[i % GALLERY_PHOTOS.length]}
                title={GALLERY_ALTS[i % GALLERY_PHOTOS.length]}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Icon name="ZoomIn" size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <Icon name="X" size={32} />
          </button>
          <button
            className="absolute left-4 text-white/70 hover:text-white"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length); }}
          >
            <Icon name="ChevronLeft" size={40} />
          </button>
          <img
            src={GALLERY_PHOTOS[lightbox]}
            alt={GALLERY_ALTS[lightbox]}
            title={GALLERY_ALTS[lightbox]}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white/70 hover:text-white"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % GALLERY_PHOTOS.length); }}
          >
            <Icon name="ChevronRight" size={40} />
          </button>
          <div className="absolute bottom-4 text-white/50 text-sm">{lightbox + 1} / {GALLERY_PHOTOS.length}</div>
        </div>
      )}

      <style>{`
        @keyframes gallery-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-${GALLERY_PHOTOS.length} * (18rem + 1rem))); }
        }
      `}</style>
    </section>
  );
};

export default GallerySection;