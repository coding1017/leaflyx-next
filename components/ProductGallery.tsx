// components/ProductGallery.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react"; // optional icons; falls back to text if missing

type Props = {
  images?: string[];     // normalized array from db (preferred)
  primary?: string;      // fallback single image
  alt?: string;
  className?: string;
  /** If true, show a modal lightbox when clicking the main image */
  enableLightbox?: boolean;
  /** Aspect ratio for main stage (default: 1/1) */
  aspect?: "square" | "3/4" | "4/3" | "16/9";
};

const PLACEHOLDER = "/images/placeholder.png";

function usePreload(src?: string) {
  useEffect(() => {
    if (!src || src === PLACEHOLDER) return;
    const img = new window.Image();
    img.src = src;
  }, [src]);
}

function BgImage({ src, alt, aspect = "square" }: { src: string; alt?: string; aspect?: Props["aspect"] }) {
  const [bg, setBg] = useState<string>(PLACEHOLDER);

  useEffect(() => {
    let cancelled = false;
    const real = new window.Image();
    real.onload = () => { if (!cancelled) setBg(src || PLACEHOLDER); };
    real.onerror = () => { if (!cancelled) setBg(PLACEHOLDER); };
    real.src = src || PLACEHOLDER;
    return () => { cancelled = true; };
  }, [src]);

  const aspectClass =
    aspect === "3/4" ? "aspect-[3/4]" :
    aspect === "4/3" ? "aspect-[4/3]" :
    aspect === "16/9" ? "aspect-video" :
    "aspect-square";

  return (
    <div
      role="img"
      aria-label={alt}
      className={`w-full ${aspectClass} rounded-2xl`}
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "rgba(0,0,0,0.02)",
      }}
    />
  );
}

export default function ProductGallery({
  images,
  primary,
  alt = "Product image",
  className,
  enableLightbox = true,
  aspect = "square",
}: Props) {
  const slides = useMemo(() => {
    const arr = Array.isArray(images) && images.length ? images : [primary || PLACEHOLDER];
    // de-dup; ensure strings
    return Array.from(new Set(arr.filter(Boolean)));
  }, [images, primary]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const canSlide = slides.length > 1;

  // Preload neighbors
  const nextIndex = (idx + 1) % slides.length;
  const prevIndex = (idx - 1 + slides.length) % slides.length;
  usePreload(slides[nextIndex]);
  usePreload(slides[prevIndex]);

  const go = useCallback((n: number) => {
    setIdx((i) => (i + n + slides.length) % slides.length);
  }, [slides.length]);

  // Keyboard navigation on focus
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Enter" && enableLightbox) setOpen(true);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [go, open, enableLightbox]);

  // Swipe / drag (touch + mouse)
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = (e.clientX ?? 0) - (startX.current ?? 0);
    const threshold = 30;
    if (dx > threshold) go(-1);
    else if (dx < -threshold) go(1);
    startX.current = null;
  };
  const onPointerCancel = () => {
    dragging.current = false;
    startX.current = null;
  };

  return (
    <div className={className}>
      {/* Main Stage */}
      <div
        ref={stageRef}
        tabIndex={0}
        className="relative select-none outline-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <BgImage src={slides[idx] || PLACEHOLDER} alt={alt} aspect={aspect} />

        {/* Arrows */}
        {canSlide && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white p-2"
              onClick={() => go(-1)}
            >
              {ChevronLeft ? <ChevronLeft size={18} /> : "‹"}
            </button>
            <button
              type="button"
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white p-2"
              onClick={() => go(1)}
            >
              {ChevronRight ? <ChevronRight size={18} /> : "›"}
            </button>
          </>
        )}

        {/* Click to open lightbox */}
        {enableLightbox && (
          <button
            type="button"
            aria-label="Open image"
            className="absolute inset-0"
            onClick={() => setOpen(true)}
            style={{ cursor: "zoom-in" }}
          />
        )}
      </div>

      {/* Thumbnails */}
      {canSlide && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2">
          {slides.map((s, i) => (
            <button
              key={s + i}
              type="button"
              className={`rounded-xl overflow-hidden border transition ${
                i === idx ? "border-[var(--brand-gold)]" : "border-white/10 hover:border-white/25"
              }`}
              onClick={() => setIdx(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <div
                className="w-full aspect-square"
                style={{
                  backgroundImage: `url(${s || PLACEHOLDER})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "rgba(0,0,0,0.04)",
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox / Modal */}
      {enableLightbox && open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute -top-10 right-0 text-white/90 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {X ? <X /> : "✕"}
            </button>

            {/* Lightbox stage uses same background approach */}
            <div
              className="w-full aspect-video md:aspect-[4/3] lg:aspect-[3/2] rounded-2xl"
              style={{
                backgroundImage: `url(${slides[idx] || PLACEHOLDER})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />

            {canSlide && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white p-3"
                  onClick={() => go(-1)}
                >
                  {ChevronLeft ? <ChevronLeft /> : "‹"}
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white p-3"
                  onClick={() => go(1)}
                >
                  {ChevronRight ? <ChevronRight /> : "›"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
