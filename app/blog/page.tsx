// app/blog/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import Container from "@/components/Container";
import PageHeading from "@/components/PageHeading";
import { getAllPostsSorted, getFeaturedPosts } from "@/lib/blog";

function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function HeroCard({
  href,
  title,
  excerpt,
  category,
}: {
  href: string;
  title: string;
  excerpt: string;
  category?: string;
}) {
  return (
    <Link
      href={href}
      className="
        group block rounded-3xl overflow-hidden
        border border-white/10 bg-black/20
        hover:bg-black/28 transition
        shadow-[0_18px_60px_rgba(0,0,0,0.35),inset_0_1px_14px_rgba(255,255,255,0.04)]
      "
    >
      <div className="p-6">
        {category ? (
          <div className="text-xs tracking-wide uppercase text-white/55">{category}</div>
        ) : null}

        <div className="mt-2 text-xl font-semibold">
          <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
            {title}
          </span>
        </div>

        <p className="mt-2 text-sm text-white/70">{excerpt}</p>

        <div className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--brand-gold)]">
          Read more <span className="opacity-70 group-hover:opacity-100">→</span>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogIndexPage() {
  const featured = getFeaturedPosts(3);
  const all = getAllPostsSorted();

  return (
    <Container>
      <div className="pt-6">
        <div className="mb-2 text-xs tracking-wide uppercase text-white/55">
          Learn · Leaflyx
        </div>

        <PageHeading>Blog</PageHeading>

        {/* Featured */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {featured.map((p) => (
            <HeroCard
              key={p.slug}
              href={`/blog/${p.slug}`}
              title={p.title}
              excerpt={p.excerpt}
              category={p.category}
            />
          ))}
        </div>

        {/* All articles */}
        <div className="mt-10">
          <div className="text-sm tracking-wide uppercase text-white/55">All Articles</div>

          <div className="mt-4 grid gap-3">
            {all.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="
                  group rounded-3xl p-5
                  border border-white/10
                  bg-black/18 hover:bg-black/25 transition
                "
              >
                <div className="text-xs text-white/55">{prettyDate(p.publishedAt)}</div>

                <div className="mt-1 font-semibold text-white/85 group-hover:text-white">
                  {p.title}
                </div>

                <div className="mt-1 text-sm text-white/65">{p.excerpt}</div>

                <div className="mt-3 text-sm text-[var(--brand-gold)]">
                  Learn more <span className="opacity-70 group-hover:opacity-100">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
