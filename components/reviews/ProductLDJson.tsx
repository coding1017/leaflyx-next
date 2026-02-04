"use client";
import Script from "next/script";
import { useEffect, useState } from "react";

type Props = {
  productSlug: string;
  name: string;
  image?: string | null;
  sku: string | number;
  brand?: string;
};

export default function ProductLDJson({ productSlug, name, image, sku, brand = "Leaflyx.co" }: Props) {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await fetch(`/api/reviews?slug=${encodeURIComponent(productSlug)}`, { cache: "no-store" });
      const j = await r.json();
      if (!alive) return;
      setAvg(j.average || null);
      setCount(j.total || 0);
    })();
    return () => { alive = false; };
  }, [productSlug]);

  const data: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: image ? [image] : [],
    sku: String(sku),
    brand: { "@type": "Brand", name: brand },
  };
  if (count > 0 && typeof avg === "number") {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(2),
      reviewCount: String(count),
    };
  }

  return (
    <Script
      id={`ld-product-${productSlug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
