"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Truck,
  ShoppingBag,
  Instagram,
  ArrowRight,
} from "lucide-react";
import { FormEvent } from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: wire up to your email provider
  }

  return (
    <footer className="mt-16 border-t border-[var(--brand-gold)]/50 bg-black/40 backdrop-blur-md">
      {/* gold keyline */}
      <div className="h-[1px] w-full bg-[var(--brand-gold)]/40" />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* panel */}
        <div className="rounded-3xl border border-[var(--brand-gold)]/35 bg-black/55 shadow-[0_10px_60px_rgba(212,175,55,.12)]">
          {/* top: brand + newsletter */}
          <div className="p-6 md:p-8">
            <div className="grid gap-8 md:grid-cols-3 items-start">
              {/* Brand block */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl p-2 glow-card aura-strong border border-[var(--brand-gold)]/40">
                    <Image
                      src="/leaflyx_logo_256.png"
                      alt="Leaflyx.co"
                      width={40}
                      height={40}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-lg font-semibold tracking-wide">Leaflyx.co</div>
                    <div className="text-xs text-neutral-400">Premium THCA goods</div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-neutral-300">
                  Curated, lab-tested products delivered with discretion and care. Elevate your ritual
                  with boutique flower, edibles, and vapes.
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-300">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-gold)]/40 px-3 py-1">
                    <Shield className="w-3.5 h-3.5" /> COA available
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-gold)]/40 px-3 py-1">
                    <Truck className="w-3.5 h-3.5" /> Fast shipping
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-gold)]/40 px-3 py-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> Discreet packaging
                  </span>
                </div>
              </div>

              {/* Newsletter */}
              <div className="md:col-span-2">
                <div className="rounded-2xl border border-[var(--brand-gold)]/35 bg-black/40 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-sm uppercase tracking-widest text-neutral-300">
                        Stay in the loop
                      </div>
                      <div className="text-base md:text-lg font-medium">Drops, deals & new strains</div>
                    </div>
                  </div>
                  <form onSubmit={onSubscribe} className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      className="flex-1 rounded-xl bg-black/50 border border-neutral-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-gold)]"
                    />
                    <button
                      type="submit"
                      className="btn-gold rounded-xl px-4 py-2.5 text-sm font-medium border border-[var(--brand-gold)] inline-flex items-center gap-2"
                    >
                      Subscribe <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                  <p className="mt-2 text-xs text-neutral-400">
                    By subscribing you agree to our{" "}
                    <Link href="/terms" className="underline underline-offset-4 hover:text-white">
                      Terms
                    </Link>{" "}
                    &{" "}
                    <Link href="/privacy" className="underline underline-offset-4 hover:text-white">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* middle: link columns */}
          <div className="px-6 md:px-8 pb-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {/* Shop */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-[var(--brand-gold)]">Shop</h4>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li>
                    <Link href="/products" className="hover:text-white">
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?sort=new" className="hover:text-white">
                      New Arrivals
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?badge=Bestseller" className="hover:text-white">
                      Bestsellers
                    </Link>
                  </li>
                  <li>
                    <Link href="/gift-cards" className="hover:text-white">
                      Gift Cards
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Categories (sample) */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-[var(--brand-gold)]">Categories</h4>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li>
                    <Link href="/category/flower" className="hover:text-white">
                      Flower
                    </Link>
                  </li>
                  <li>
                    <Link href="/category/vapes" className="hover:text-white">
                      Vapes
                    </Link>
                  </li>
                  <li>
                    <Link href="/category/edibles" className="hover:text-white">
                      Edibles
                    </Link>
                  </li>
                  <li>
                    <Link href="/category/beverages" className="hover:text-white">
                      Beverages
                    </Link>
                  </li>
                  <li>
                    <Link href="/category/pre-rolls" className="hover:text-white">
                      Pre-Rolls
                    </Link>
                  </li>
                  <li>
                    <Link href="/category/concentrates" className="hover:text-white">
                      Concentrates
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Help */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-[var(--brand-gold)]">Help</h4>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li>
                    <Link href="/shipping-returns" className="hover:text-white">
                      Shipping & Returns
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="hover:text-white">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/coa" className="hover:text-white">
                      Certificates of Analysis
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-[var(--brand-gold)]">Contact</h4>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />{" "}
                    <a href="mailto:support@leaflyx.co" className="hover:text-white">
                      support@leaflyx.co
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />{" "}
                    <a href="tel:+15551234567" className="hover:text-white">
                      (555) 123-4567
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> 123 Aurora Ave, Suite 9, CA
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Mon–Fri 10am–6pm PT
                  </li>
                  <li className="flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    <a
                      href="https://instagram.com/leaflyxco"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white"
                    >
                      @leaflyxco
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* bottom: legal row */}
          <div className="px-6 md:px-8 py-4 border-t border-[var(--brand-gold)]/25 rounded-b-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-neutral-400">
              © {year} Leaflyx.co — All rights reserved. Must be 21+ to purchase. Verify local regulations
              before ordering.
              <span className="block mt-1 text-[11px] text-neutral-500">
                Hemp-derived products intended to comply with the 2018 Farm Bill (≤ 0.3% Δ9-THC by dry weight).
                Availability and legality may vary by state.
              </span>
            </p>

            <div className="flex items-center gap-4 text-xs">
              <Link href="/privacy" className="text-neutral-300 hover:text-white">
                Privacy
              </Link>
              <span className="text-neutral-500">•</span>
              <Link href="/terms" className="text-neutral-300 hover:text-white">
                Terms
              </Link>
              <span className="text-neutral-500">•</span>
              <Link href="/refunds" className="text-neutral-300 hover:text-white">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
