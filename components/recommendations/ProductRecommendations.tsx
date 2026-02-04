// components/recommendations/ProductRecommendations.tsx
import { getRecommendations, getRecommendationDisplayPrice } from "@/lib/recommendations";
import RecommendationRail from "./RecommendationRail";

export default function ProductRecommendations({
  productIdOrSlug,
}: {
  productIdOrSlug: string;
}) {
  const { alsoViewed } = getRecommendations(productIdOrSlug, 10);

  return (
    <div className="mt-10">
      <RecommendationRail
        title="Customers also viewed"
        subtitle="Similar picks in the same vibe — curated for you."
        items={alsoViewed.map((p) => {
          const dp = getRecommendationDisplayPrice(p);
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            image: p.image,
            price: dp.price,
            priceFrom: dp.from,
          };
        })}
      />
    </div>
  );
}
