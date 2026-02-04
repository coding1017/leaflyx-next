// app/blog/[slug]/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Container from "@/components/Container";
import PageHeading from "@/components/PageHeading";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blog";

type Props = { params: { slug: string } };

/**
 * ✅ Prebuild known blog slugs at deploy time.
 * Keeps blog fast and easier for crawlers to pick up.
 */
export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Not found · Leaflyx" };

  const title = `${post.title} · Leaflyx Blog`;
  return {
    title,
    description: post.excerpt,
    openGraph: { title, description: post.excerpt },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <Container>
      <div className="pt-6">
        <div className="mb-2 text-xs tracking-wide uppercase text-white/55">
          {post.category ?? "Blog"} · {prettyDate(post.publishedAt)}
        </div>

        <PageHeading>{post.title}</PageHeading>

        <div
          className="
            mt-6 rounded-3xl p-6 md:p-8
            border border-white/10
            bg-black/20
            shadow-[0_18px_60px_rgba(0,0,0,0.35),inset_0_1px_14px_rgba(255,255,255,0.04)]
          "
        >
          <div className="prose prose-invert max-w-none prose-p:text-white/75 prose-li:text-white/75">
            {post.content.map((b, i) => {
              if (b.type === "h2") {
                return (
                  <h2 key={i} className="mt-8 text-xl font-semibold">
                    <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
                      {b.text}
                    </span>
                  </h2>
                );
              }
              if (b.type === "ul") {
                return (
                  <ul key={i} className="mt-3 list-disc pl-6">
                    {b.items.map((it, idx) => (
                      <li key={idx}>{it}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="mt-3 leading-relaxed">
                  {b.text}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </Container>
  );
}
