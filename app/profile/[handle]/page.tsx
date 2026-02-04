import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { handle: string } }) {
  const handle = params.handle.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { handle },
    select: { publicProfileEnabled: true, name: true, publicBio: true, handle: true },
  });

  if (!user || !user.publicProfileEnabled) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const title = user.name ? `${user.name} (@${user.handle}) — Leaflyx` : `@${user.handle} — Leaflyx`;
  const desc = user.publicBio?.slice(0, 155) || `Public profile for @${user.handle} on Leaflyx.`;

  return {
    title,
    description: desc,
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfilePage({ params }: { params: { handle: string } }) {
  const handle = params.handle.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { handle },
    select: {
      publicProfileEnabled: true,
      name: true,
      handle: true,
      publicBio: true,
    },
  });

  if (!user || !user.publicProfileEnabled) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-white">
      <div className="rounded-2xl border border-white/10 bg-black/35 p-6">
        <div className="text-sm text-white/60">Public profile</div>
        <h1 className="mt-2 text-2xl font-semibold">
          {user.name ? user.name : `@${user.handle}`}
        </h1>
        <div className="mt-1 text-white/70">@{user.handle}</div>

        {user.publicBio ? (
          <p className="mt-4 text-white/80 leading-relaxed">{user.publicBio}</p>
        ) : (
          <p className="mt-4 text-white/60">No bio yet.</p>
        )}

        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
          This page never shows private contact info or order history.
        </div>
      </div>
    </main>
  );
}
