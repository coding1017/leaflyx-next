// components/ProductLightbox.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image, { StaticImageData } from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { src: string | StaticImageData; alt?: string };

type Props = {
  images: LightboxImage[];
  startIndex?: number;
  onClose: () => void;

  /** optional hooks if you want them */
  onPrev?: () => void;
  onNext?: () => void;
};

export default function ProductLightbox({
  images,
  startIndex = 0,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(startIndex);

  // zoom/pan state
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  // swipe state
  const touch = useRef<{ x: number; y: number } | null>(null);

  const resetZoom = () => {
    setScale(1);
    setTx(0);
    setTy(0);
    dragging.current = false;
    last.current = null;
  };

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  // lock body scroll while open
  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // keep index in sync if startIndex changes while mounted
  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  // reset zoom when slide changes
  useEffect(() => {
    resetZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        resetZoom();
        next();
        onNext?.();
      }
      if (e.key === "ArrowLeft") {
        resetZoom();
        prev();
        onPrev?.();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]); // next/prev/resetZoom are stable enough for this usage

  const wheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.2; // zoom in on wheel up
    setScale((s) => {
      const ns = Math.min(5, Math.max(1, s + delta));
      if (ns === 1) {
        setTx(0);
        setTy(0);
      }
      return ns;
    });
  };

  const onDoubleClick = () => {
    setScale((s) => {
      const ns = s > 1 ? 1 : 2;
      if (ns === 1) {
        setTx(0);
        setTy(0);
      }
      return ns;
    });
  };

  // drag to pan when zoomed
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setTx((x) => x + dx);
    setTy((y) => y + dy);
  };

  const onMouseUp = () => {
    dragging.current = false;
    last.current = null;
  };

  // swipe (touch) to change slides (only when not zoomed)
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;

    if (Math.abs(dx) > 50 && scale === 1) {
      if (dx < 0) {
        resetZoom();
        next();
        onNext?.();
      } else {
        resetZoom();
        prev();
        onPrev?.();
      }
    }

    touch.current = null;
  };

  const img = images[index];

  const transform = useMemo(
    () => ({ transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})` }),
    [tx, ty, scale]
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm text-white"
      aria-modal="true"
      role="dialog"
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onClick={() => onClose()}
    >
      {/* Top bar */}
      <div className="absolute left-4 top-4 flex items-center gap-3">
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
          {index + 1} / {images.length}
        </span>
      </div>

      {/* Close */}
      <button
        aria-label="Close"
        className="absolute right-4 top-4 rounded-md p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] text-[#d4af37]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="h-5 w-5" />
      </button>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          {/* LEFT button = previous */}
          <button
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white p-3"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
              prev(); // ← keep this as prev()
              onPrev?.();
            }}
          >
            <ChevronLeft />
          </button>

          {/* RIGHT button = next */}
          <button
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white p-3"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
              next(); // ← keep this as next()
              onNext?.();
            }}
          >
            <ChevronRight />
          </button>
        </>
      )}

      {/* Image stage */}
      <div
        className="flex h-full w-full items-center justify-center select-none"
        onWheel={wheel}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative" style={transform}>
          <Image
            src={img.src}
            alt={img.alt ?? ""}
            width={1600}
            height={1600}
            priority
            className="max-h-[86vh] max-w-[92vw] object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
