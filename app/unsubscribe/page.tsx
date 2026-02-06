// app/unsubscribe/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
};

export default function UnsubscribePage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-14 text-white">
      <h1 className="text-2xl font-semibold">Unsubscribe</h1>
      <p className="mt-2 text-white/70">
        If you clicked an unsubscribe link from an email, your request will be processed.
      </p>
    </main>
  );
}
