import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const handle = params.handle.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { handle },
    select: { publicProfileEnabled: true, name: true, publicBio: true },
  });

  // Not opted-in => prevent indexing and also stop discovery
  if (!user || !user.publicProfileEnabled) {
    return {
      title: "Profile",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${user.name ?? handle} — Profile`,
    description: user.publicBio ?? undefined,
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfile({ params }: { params: { handle: string } }) {
  const handle = params.handle.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { handle },
    select: {
      publicProfileEnabled: true,
      name: true,
      publicBio: true,
      handle: true,
      // IMPORTANT: do NOT select email/phone/address/socials/orders here
    },
  });

  if (!user || !user.publicProfileEnabled) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-white">{user.name ?? user.handle}</h1>
      {user.publicBio ? <p className="mt-3 text-white/75">{user.publicBio}</p> : null}

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-5 text-white/70">
        <div className="text-sm">
          This profile is public because the user explicitly enabled it. No orders or private contact info are shown.
        </div>
      </div>
    </main>
  );
}
