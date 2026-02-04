// app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { Inter } from "next/font/google";
import AgeGate from "../components/AgeGate";
import Providers from "./providers";
import { ToastProvider } from "../components/ToastContext";
import CompareBar from "@/components/compare/CompareBar";

const inter = Inter({ subsets: ["latin"] });

// Use env in prod; fallback in dev
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  // ✅ Fix warning + ensure absolute OG/Twitter URLs
  metadataBase: new URL(siteUrl),

  title: "Leaflyx — Premium THCA goods",
  description: "Modern THCA storefront with lab-tested potency and fast delivery.",
  openGraph: {
    title: "Leaflyx",
    description: "Modern THCA storefront with lab-tested potency.",
    url: siteUrl,
    siteName: "Leaflyx",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leaflyx",
    description: "Modern THCA storefront",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AgeGate />
        <div className="site-bg" />

        {/* ✅ SessionProvider + CartProvider + Toasts */}
        <ToastProvider>
          <Providers>
            <Header />
            {/* Keep content + footer above the background */}
            <div className="relative z-10">
              <main>{children}</main>
              <CompareBar />
              <Footer />
            </div>
          </Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
