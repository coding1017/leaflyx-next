// components/ProductImageGallery.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type PI = string | { src: string } | any;

type Props = {
  images?: PI[];
  primary?: PI;
  alt?: string;
  className?: string;
  aspect?: "square" | "3/4" | "4/3" | "16/9";
  enableLightbox?: boolean;
};

const PLACEHOLDER = "/images/placeholder.png";

/* ---------------- Utils ---------------- */
const srcOf = (img: PI): string => {
  if (!img) return PLACEHOLDER;
  if (typeof img === "string") return img;
  if (typeof img === "object" && img?.src) return String(img.src);
  return PLACEHOLDER;
};

function usePreload(src?: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!src || src === PLACEHOLDER) return;
    const im = new window.Image();
    im.src = src;
  }, [src]);
}

/* ---------------- Inline image (BG-based) with spinner ---------------- */
function BgImage({
  src,
  alt,
  aspect = "square",
  rounded = "rounded-2xl",
}: {
  src: string;
  alt?: string;
  aspect?: Props["aspect"];
  rounded?: string;
}) {
  const [bg, setBg] = useState<string>(PLACEHOLDER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    const real = new window.Image();
    real.onload = () => {
      if (!cancelled) {
        setBg(src || PLACEHOLDER);
        setLoaded(true);
      }
    };
    real.onerror = () => {
      if (!cancelled) {
        setBg(PLACEHOLDER);
        setLoaded(true);
      }
    };
    real.src = src || PLACEHOLDER;
    return () => {
      cancelled = true;
    };
  }, [src]);

  const aspectClass =
    aspect === "3/4"
      ? "aspect-[3/4]"
      : aspect === "4/3"
      ? "aspect-[4/3]"
      : aspect === "16/9"
      ? "aspect-video"
      : "aspect-square";

  return (
    <div className={`relative w-full ${aspectClass} ${rounded}`}>
      {/* spinner */}
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white/70" />
        </div>
      )}
      {/* image layer */}
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundColor: "rgba(0,0,0,0.02)",
        }}
      />
    </div>
  );
}

/* ---------------- Main component ---------------- */
export default function ProductImageGallery({
  images,
  primary,
  alt = "Product image",
  className,
  aspect = "3/4",
  enableLightbox = true,
}: Props) {
  // Normalize
  const slides = useMemo(() => {
    const arr = (Array.isArray(images) && images.length ? images : [primary]).filter(
      Boolean
    ) as PI[];
    const urls = arr.map(srcOf).filter(Boolean);
    return Array.from(new Set(urls.length ? urls : [PLACEHOLDER]));
  }, [images, primary]);

  const [idx, setIdx] = useState(0);
  const canSlide = slides.length > 1;

  // Preload neighbors
  const nextIndex = (idx + 1) % slides.length;
  const prevIndex = (idx - 1 + slides.length) % slides.length;
  usePreload(slides[nextIndex]);
  usePreload(slides[prevIndex]);

  const go = useCallback(
    (d: number) => {
      setIdx((i) => (i + d + slides.length) % slides.length);
    },
    [slides.length]
  );

  /* ---------- Inline stage (thumbnail area) ---------- */
  const [open, setOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Auto-focus so Arrow keys work without clicking
  useEffect(() => {
    stageRef.current?.focus();
  }, []);

  // Inline keyboard: only handle when modal is closed
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === "Escape") setOpen(false);
        return; // prevent double handling while modal is open
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Enter" && enableLightbox) setOpen(true);
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [go, open, enableLightbox]);

  // Swipe in inline stage
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
    if (dx > 30) go(-1);
    else if (dx < -30) go(1);
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
        onMouseEnter={() => stageRef.current?.focus()}
        onClick={() => stageRef.current?.focus()}
      >
        {/* Image at bottom of stack */}
        <div className="relative z-0">
          <BgImage src={slides[idx]} alt={alt} aspect={aspect} />
        </div>

        {/* Inline arrows ABOVE the overlay */}
        {canSlide && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white p-2 z-20 pointer-events-auto"
              onClick={() => go(-1)}
            >
              {ChevronLeft ? <ChevronLeft size={18} /> : "‹"}
            </button>
            <button
              type="button"
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 text-white p-2 z-20 pointer-events-auto"
              onClick={() => go(1)}
            >
              {ChevronRight ? <ChevronRight size={18} /> : "›"}
            </button>
          </>
        )}

        {/* Click-to-open overlay BELOW arrows but ABOVE image */}
        {enableLightbox && (
          <button
            type="button"
            aria-label="Open image"
            className="absolute inset-0 z-10"
            onClick={() => setOpen(true)}
            style={{ cursor: "zoom-in" }}
          />
        )}
      </div>

      {/* Thumbs */}
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

      {/* ---------- LIGHTBOX (fullscreen with zoom/pan) ---------- */}
      {open && (
        <Lightbox
          slides={slides}
          index={idx}
          onClose={() => setOpen(false)}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          onIndex={setIdx}
        />
      )}
    </div>
  );
}

/* ---------------- Lightbox component (renders via PORTAL) ---------------- */

function Lightbox({
  slides,
  index,
  onClose,
  onPrev,
  onNext,
  onIndex,
}: {
  slides: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onIndex: (i: number) => void;
}) {
  const [mounted, setMounted] = useState(false); // for portal
  const [idx, setIdx] = useState(index);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const prevFocusRef = useRef<Element | null>(null);

  // SR announcement
  const liveText = `Image ${idx + 1} of ${slides.length}`;

  // Reduce motion preference
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const set = () => setReduceMotion(!!mq?.matches);
    set();
    mq?.addEventListener?.("change", set);
    return () => mq?.removeEventListener?.("change", set);
  }, []);

  useEffect(() => setIdx(index), [index]);
  useEffect(() => onIndex(idx), [idx, onIndex]);

  // Lock page scroll while open + focus management
  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // focus trap start (simple): move focus to close, restore on unmount
    prevFocusRef.current = document.activeElement;
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      (prevFocusRef.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  // Keyboard handling for fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next(); // Right -> next
      if (e.key === "ArrowLeft") prev();  // Left  -> prev
      // crude focus trap: keep focus on close when tabbing
      if (e.key === "Tab") {
        e.preventDefault();
        closeBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Navigation helpers
  const prev = useCallback(
    () => setIdx((i) => (i - 1 + slides.length) % slides.length),
    [slides.length]
  );
  const next = useCallback(() => setIdx((i) => (i + 1) % slides.length), [slides.length]);

  // Zoom / pan state
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const resetZoom = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };

  // Pinch-to-zoom
  const pinch = useRef<{ d: number } | null>(null);
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (!pinch.current) {
        pinch.current = { d };
        return;
      }
      const diff = d - pinch.current.d;
      pinch.current.d = d;
      setScale((s) => clamp(s + diff * 0.005, 1, 4));
    }
  };
  const onTouchEnd = () => {
    if (pinch.current) pinch.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const step = delta > 0 ? 0.15 : -0.15;
    setScale((s) => clamp(s + step, 1, 4));
  };

  // Double click / double tap toggle zoom
  const clickTimer = useRef<number | null>(null);
  const handleClick = () => {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setScale((s) => (s > 1 ? 1 : 2));
      if (scale <= 1) {
        setTx(0);
        setTy(0);
      }
    } else {
      clickTimer.current = window.setTimeout(() => {
        clickTimer.current = null;
      }, 250);
    }
  };

  // Drag to pan when zoomed
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || scale <= 1) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setTx((t) => t + dx);
    setTy((t) => t + dy);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  // Loading indicator for fullscreen slide
  const [fsLoaded, setFsLoaded] = useState(false);
  useEffect(() => {
    setFsLoaded(false);
    const im = new Image();
    im.onload = () => setFsLoaded(true);
    im.onerror = () => setFsLoaded(true);
    im.src = slides[idx] || PLACEHOLDER;
  }, [idx, slides]);

  if (!mounted) return null;

  // PORTAL: render at document.body to escape parent stacking/overflow
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="relative h-12 flex items-center justify-center text-white/90">
        <div className="absolute left-4 top-3 z-50">
          <button
            ref={closeBtnRef}
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full p-2.5 bg-white/10 hover:bg-white/20 text-white focus:outline-none z-50"
            style={{ transform: "scale(0.85)" }} // ~15% smaller, per your preference
          >
            <X className="h-7 w-7" strokeWidth={2.3} />
          </button>
        </div>

        {/* Slide counter */}
        <div className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
          {idx + 1} / {slides.length}
        </div>
        {/* Screen-reader live region */}
        <div aria-live="polite" className="sr-only">{liveText}</div>
      </div>

      {/* Stage */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        onWheel={onWheel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrows */}
        {slides.length > 1 && (
          <>
            {/* LEFT = previous */}
            <button
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/10 hover:bg-white/20 text-white p-3"
              onClick={(e) => {
                e.stopPropagation();
                resetZoom();
                prev();
                onPrev();
              }}
            >
              <ChevronLeft />
            </button>

            {/* RIGHT = next */}
            <button
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/10 hover:bg-white/20 text-white p-3"
              onClick={(e) => {
                e.stopPropagation();
                resetZoom();
                next();
                onNext();
              }}
            >
              <ChevronRight />
            </button>
          </>
        )}

        {/* Spinner while slide loads */}
        {!fsLoaded && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white/70" />
          </div>
        )}

        {/* Zoomable layer */}
        <div
          className="touch-none"
          onDoubleClick={handleClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
        >
          <div
            className="w-[90vw] max-w-6xl h-[70vh] md:h-[80vh] rounded-2xl"
            style={{
              backgroundImage: `url(${slides[idx] || PLACEHOLDER})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "contain",
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              transition:
                dragging.current || reduceMotion ? "none" : "transform 120ms ease",
              boxShadow: scale > 1 ? "0 10px 40px rgba(0,0,0,.35)" : "none",
            }}
          />
        </div>
      </div>

      {/* Footer helpers */}
      <div className="h-10 flex items-center justify-center gap-4 text-white/70 text-xs">
        <span>Scroll to zoom • Double-click to toggle zoom • Drag to pan • Esc to close</span>
      </div>
    </div>,
    document.body
  );
}
