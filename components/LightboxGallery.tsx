// components/LightboxGallery.tsx
"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image, { type StaticImageData } from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { shimmer, toBase64 } from "@/utils/blur";

type PI = string | StaticImageData;
type Img = { src: PI; alt?: string };

const isStatic = (s: PI): s is StaticImageData =>
  typeof s === "object" && s !== null && "src" in s;

export default function LightboxGallery({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: Img[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  if (!images?.length) return null;
  const img = images[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-5xl aspect-[4/3] bg-black/40 rounded-2xl ring-1 ring-[var(--brand-gold)]/40 shadow-2xl">
          <Image
            src={img.src}          // ✅ pass PI directly
            alt={img.alt ?? ""}
            fill
            sizes="100vw"
            className="object-contain"
            placeholder="blur"
            {...(isStatic(img.src)
              ? {}
              : { blurDataURL: `data:image/svg+xml;base64,${toBase64(shimmer(1200, 900))}` })}
            quality={75}
            priority
          />

          {/* Prev / Next */}
          <button
            aria-label="Previous image"
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/60 hover:bg-black/80 ring-1 ring-white/20"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            aria-label="Next image"
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/60 hover:bg-black/80 ring-1 ring-white/20"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Close */}
          <button
            ref={closeBtnRef}
            aria-label="Close"
            onClick={onClose}
            className="absolute -top-3 -right-3 rounded-full p-2 bg-[var(--brand-green)] text-[var(--brand-gold)] ring-2 ring-[var(--brand-gold)] shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
