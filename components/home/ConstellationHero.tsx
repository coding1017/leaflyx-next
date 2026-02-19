"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

type Orb = {
  id: string;
  label: string;
  href: string;
  x: number; // %
  y: number; // %
  size: number; // px
  gradient: "goldToEmerald" | "emeraldToGold";
  drift: { dx: number; dy: number; dur: number; delay: number };
};

type Puff = {
  id: string;
  x: number;
  y: number;
  t: number;
  tone: "gold" | "emerald";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ConstellationHero() {
  const router = useRouter();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const lastHoverPuffAt = useRef(0);

  const orbs: Orb[] = useMemo(() => {
    const cats = [
      { id: "shop", label: "Shop", href: "/products", size: 180 },
      { id: "flower", label: "Flower", href: "/category/flower", size: 140 },
      { id: "smalls", label: "Smalls", href: "/category/smalls", size: 120 },
      { id: "vapes", label: "Vapes", href: "/category/vapes", size: 125 },
      { id: "edibles", label: "Edibles", href: "/category/edibles", size: 132 },
      { id: "beverages", label: "Beverages", href: "/category/beverages", size: 118 },
      { id: "pre", label: "Pre-rolls", href: "/category/pre-rolls", size: 132 },
      { id: "conc", label: "Concentrates", href: "/category/concentrates", size: 140 },
    ];

    const layout = [
      { x: 26, y: 56 },
      { x: 18, y: 28 },
      { x: 50, y: 24 },
      { x: 82, y: 30 },
      { x: 64, y: 54 },
      { x: 40, y: 78 },
      { x: 78, y: 74 },
      { x: 56, y: 78 },
    ];

    // “move around more” amplitudes
    const driftTable = [
      { dx: 34, dy: -28, dur: 11.2 },
      { dx: -30, dy: 24, dur: 12.6 },
      { dx: 26, dy: 34, dur: 13.1 },
      { dx: -34, dy: -24, dur: 12.2 },
      { dx: 30, dy: -34, dur: 14.1 },
      { dx: -26, dy: 28, dur: 11.8 },
      { dx: 38, dy: 18, dur: 15.0 },
      { dx: -38, dy: -18, dur: 14.4 },
    ];

    return cats.map((c, i) => {
      const gradient = i % 2 === 0 ? "goldToEmerald" : "emeraldToGold";
      const d = driftTable[i % driftTable.length];
      return {
        id: c.id,
        label: c.label,
        href: c.href,
        size: c.size,
        x: layout[i]?.x ?? 50,
        y: layout[i]?.y ?? 50,
        gradient,
        drift: {
          dx: d.dx,
          dy: d.dy,
          dur: d.dur,
          // negative delays de-sync immediately (more “natural”)
          delay: -(i * 0.65),
        },
      };
    });
  }, []);

  function onPointerMove(e: React.PointerEvent) {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    setMouse({ x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) });
  }

  function onPointerLeave() {
    setMouse({ x: 0, y: 0 });
  }

  function spawnPuffAt(x: number, y: number, tone: Puff["tone"], lifetimeMs: number) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const puff: Puff = { id, x, y, t: Date.now(), tone };
    setPuffs((cur) => [...cur, puff].slice(-18));
    window.setTimeout(() => setPuffs((cur) => cur.filter((p) => p.id !== id)), lifetimeMs);
  }

  function onPanelPointerMove(e: React.PointerEvent) {
    const panel = panelRef.current;
    if (!panel) return;

    const now = Date.now();
    if (now - lastHoverPuffAt.current < 95) return;
    lastHoverPuffAt.current = now;

    const r = panel.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    const tone: Puff["tone"] = Math.random() > 0.5 ? "gold" : "emerald";
    spawnPuffAt(x, y, tone, 640);
  }

  const gradientClass = (g: Orb["gradient"]) =>
    g === "goldToEmerald"
      ? "bg-gradient-to-r from-[var(--brand-gold)] via-[#F5D77A] to-emerald-300"
      : "bg-gradient-to-r from-emerald-300 via-[#F5D77A] to-[var(--brand-gold)]";

  function haloForGradient(g: Orb["gradient"]) {
    return g === "goldToEmerald"
      ? {
          // gold→emerald text => emerald halo
          tube: "rgba(209,255,235,0.22)",
          core: "rgba(16,185,129,0.92)",
          mid: "rgba(16,185,129,0.55)",
          wide: "rgba(16,185,129,0.22)",
          shadow: "rgba(16,185,129,0.55)",
        }
      : {
          // emerald→gold text => stronger GOLD halo (less washed)
          tube: "rgba(255,255,255,0.22)",
          core: "rgba(255,244,200,0.92)",
          mid: "rgba(245,215,122,0.92)",
          wide: "rgba(212,175,55,0.34)",
          shadow: "rgba(245,215,122,0.86)",
        };
  }

  return (
    <section
      ref={wrapRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="
        relative overflow-hidden rounded-[28px]
        border-2 border-[rgba(212,175,55,0.75)]
        bg-black
        shadow-[0_0_0_1px_rgba(0,0,0,0.75),_0_22px_70px_rgba(0,0,0,0.60),_0_0_46px_rgba(212,175,55,0.25)]
      "
    >
      {/* CSS keyframes: irregular wander + micro bob (combined feels “free floating”) */}
      <style>{`
        @keyframes orbWanderA {
          0%   { transform: translate3d(0px, 0px, 0px); }
          13%  { transform: translate3d(calc(var(--dx) * 0.55), calc(var(--dy) * -0.35), 0px); }
          27%  { transform: translate3d(calc(var(--dx) * -0.25), calc(var(--dy) * 0.75), 0px); }
          41%  { transform: translate3d(calc(var(--dx) * 0.92), calc(var(--dy) * 0.18), 0px); }
          58%  { transform: translate3d(calc(var(--dx) * -0.78), calc(var(--dy) * -0.40), 0px); }
          72%  { transform: translate3d(calc(var(--dx) * 0.30), calc(var(--dy) * 0.92), 0px); }
          86%  { transform: translate3d(calc(var(--dx) * -0.95), calc(var(--dy) * 0.10), 0px); }
          100% { transform: translate3d(0px, 0px, 0px); }
        }

        @keyframes orbWanderB {
          0%   { transform: translate3d(0px, 0px, 0px); }
          16%  { transform: translate3d(calc(var(--dx) * -0.62), calc(var(--dy) * 0.30), 0px); }
          33%  { transform: translate3d(calc(var(--dx) * 0.22), calc(var(--dy) * 0.88), 0px); }
          49%  { transform: translate3d(calc(var(--dx) * 0.86), calc(var(--dy) * -0.22), 0px); }
          65%  { transform: translate3d(calc(var(--dx) * -0.18), calc(var(--dy) * -0.92), 0px); }
          82%  { transform: translate3d(calc(var(--dx) * 0.94), calc(var(--dy) * 0.40), 0px); }
          100% { transform: translate3d(0px, 0px, 0px); }
        }

        @keyframes orbMicro {
          0%   { transform: translate3d(0px, 0px, 0px) rotate(0.001deg); }
          25%  { transform: translate3d(6px, -5px, 0px) rotate(0.001deg); }
          50%  { transform: translate3d(-4px, 7px, 0px) rotate(0.001deg); }
          75%  { transform: translate3d(5px, 4px, 0px) rotate(0.001deg); }
          100% { transform: translate3d(0px, 0px, 0px) rotate(0.001deg); }
        }
      `}</style>

      {/* Ambient background */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(1100px 650px at 20% 18%, rgba(16,185,129,0.30), transparent 62%)," +
            "radial-gradient(1100px 650px at 82% 18%, rgba(212,175,55,0.28), transparent 62%)," +
            "radial-gradient(1200px 900px at 50% 88%, rgba(0,0,0,0.84), rgba(0,0,0,0.97))",
        }}
      />

      {/* Cursor spotlight */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.60]"
        animate={{ x: mouse.x * 14, y: mouse.y * 12 }}
        transition={{ type: "spring", stiffness: 70, damping: 18 }}
        style={{
          background:
            "radial-gradient(540px 420px at 50% 45%, rgba(245,215,122,0.16), transparent 60%)," +
            "radial-gradient(600px 440px at 55% 52%, rgba(16,185,129,0.14), transparent 62%)",
        }}
      />

      {/* Puffs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {puffs.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            style={{ left: p.x, top: p.y }}
            initial={{ opacity: 0, scale: 0.55, x: -10, y: -8, filter: "blur(10px)" }}
            animate={{
              opacity: [0, 0.18, 0],
              scale: [0.6, 1.05, 1.55],
              x: [-10, -26],
              y: [-8, -44],
              filter: ["blur(10px)", "blur(14px)", "blur(18px)"],
            }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <div
              className="h-16 w-16 rounded-full"
              style={{
                background:
                  p.tone === "gold"
                    ? "radial-gradient(circle at 30% 30%, rgba(245,215,122,0.38), transparent 62%)"
                    : "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.34), transparent 62%)",
              }}
            />
          </motion.div>
        ))}
      </div>

      <div className="relative px-5 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          {/* Left copy */}
          <div className="max-w-xl">
            <p
              className="
                inline-flex items-center gap-2 rounded-full
                border border-[rgba(212,175,55,0.45)]
                bg-black/35 px-3 py-1 text-[12px] text-white/85
                backdrop-blur-md
                shadow-[0_0_24px_rgba(212,175,55,0.12)]
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gold)] shadow-[0_0_18px_rgba(212,175,55,0.65)]" />
              Premium, lab-tested THCA — clean, clear, modern.
            </p>

            <h1 className="mt-4 text-[42px] leading-[1.05] sm:text-[56px] font-extrabold tracking-tight text-white">
              Feel-good{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-gold)] via-[#F5D77A] to-emerald-300">
                THCA
              </span>{" "}
              delivered fast.
            </h1>

            <p className="mt-4 text-[15px] sm:text-[17px] text-white/82 leading-relaxed">
              Explore premium categories fast — click an orb to jump straight into what you want.
              Everything is backed by third-party COAs and clear potency labeling.
            </p>

            {/* CTAs */}
           <div className="mt-7 flex flex-col gap-3">

  {/* Shop button — updated to match pill size */}
  <button
    onClick={() => router.push("/products")}
    className="
      inline-flex items-center justify-center
      rounded-full px-5 py-2.5
      font-extrabold text-black
      bg-[var(--brand-gold)]
      border border-black/70
      shadow-[0_18px_44px_rgba(212,175,55,0.45)]
      hover:brightness-105 active:brightness-95
      transition
      w-fit
    "
  >
    Shop all products
  </button>

  <Link
  href="/coa"
  className="
    inline-flex items-center justify-center
    rounded-full px-5 py-2.5
    border-2 border-[rgba(212,175,55,0.80)]
    bg-black/85
    shadow-[0_0_0_1px_rgba(0,0,0,0.65),_0_14px_34px_rgba(0,0,0,0.45),_0_0_34px_rgba(212,175,55,0.26)]
    hover:brightness-110 active:brightness-95
    transition
    w-fit
  "
>
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-gold)] via-[#F5D77A] to-emerald-300 font-extrabold tracking-wide">
    View COA (Certificate of Analysis)
  </span>
</Link>

</div>
          </div>

          {/* Right constellation */}
          <div
            ref={panelRef}
            onPointerMove={onPanelPointerMove}
            className="relative min-h-[380px] sm:min-h-[440px] lg:min-h-[500px]"
          >
            <div
              className="
                absolute inset-0 rounded-[24px]
                border border-[rgba(212,175,55,0.35)]
                bg-black/20 backdrop-blur-[10px]
                shadow-[inset_0_0_0_1px_rgba(0,0,0,0.75)]
              "
            />

            {orbs.map((o, idx) => {
              const isShop = o.id === "shop";
              const halo = haloForGradient(o.gradient);
              const tone: Puff["tone"] = idx % 2 === 0 ? "gold" : "emerald";

              const ringGold =
                "inset 0 0 0 1px rgba(212,175,55,0.60), inset 0 0 26px rgba(212,175,55,0.16)";
              const ringDark = "inset 0 0 0 2px rgba(0,0,0,0.78)";

              const wanderName = idx % 2 === 0 ? "orbWanderA" : "orbWanderB";

              return (
                <div
                  key={o.id}
                  className="absolute"
                  style={{
                    left: `${o.x}%`,
                    top: `${o.y}%`,
                    width: o.size,
                    height: o.size,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Wander (big irregular path) */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      ["--dx" as any]: `${o.drift.dx}px`,
                      ["--dy" as any]: `${o.drift.dy}px`,
                      animationName: wanderName,
                      animationDuration: `${o.drift.dur}s`,
                      animationTimingFunction: "linear",
                      animationIterationCount: "infinite",
                      animationDelay: `${o.drift.delay}s`,
                      willChange: "transform",
                    }}
                  >
                    {/* Micro drift (small bob) */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        animationName: "orbMicro",
                        animationDuration: `${6.5 + (idx % 4) * 0.9}s`,
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                        animationDelay: `${-(idx * 0.4)}s`,
                        willChange: "transform",
                      }}
                    >
                      {/* tighter neon halo */}
                      <motion.div
                        aria-hidden="true"
                        className="absolute -inset-6 rounded-full pointer-events-none"
                        animate={{ opacity: [0.92, 1, 0.92], scale: [0.99, 1.03, 0.99] }}
                        transition={{ duration: 3.1 + idx * 0.12, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          background: `radial-gradient(circle at 50% 56%,
                            ${halo.tube} 0%,
                            ${halo.core} 12%,
                            ${halo.mid} 26%,
                            ${halo.wide} 44%,
                            transparent 66%)`,
                          filter: "blur(16px)",
                          mixBlendMode: "screen",
                        }}
                      />

                      <div
                        aria-hidden="true"
                        className="absolute -inset-10 rounded-full pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 50% 60%, ${halo.wide} 0%, transparent 70%)`,
                          filter: "blur(22px)",
                          opacity: 0.7,
                          mixBlendMode: "screen",
                        }}
                      />

                      <button
                        type="button"
                        onPointerDown={(e) => {
                          const panel = panelRef.current;
                          if (panel) {
                            const r = panel.getBoundingClientRect();
                            spawnPuffAt(e.clientX - r.left, e.clientY - r.top, tone, 780);
                          }
                          router.push(o.href);
                        }}
                        className="relative grid place-items-center rounded-full select-none w-full h-full"
                        style={{
                          background:
                            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.10), transparent 46%)," +
                            "radial-gradient(circle at 55% 70%, rgba(255,255,255,0.06), transparent 52%)," +
                            "linear-gradient(to bottom, rgba(0,0,0,0.90), rgba(0,0,0,0.98))",
                          border: "1px solid rgba(0,0,0,0.82)",
                          boxShadow:
                            `0 0 0 1px rgba(0,0,0,0.78),
                             0 20px 70px rgba(0,0,0,0.62),
                             0 0 56px ${halo.shadow},
                             0 0 24px ${halo.mid}`,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <span className="absolute inset-[10px] rounded-full pointer-events-none" style={{ boxShadow: ringGold }} />
                        <span className="absolute inset-[18px] rounded-full pointer-events-none" style={{ boxShadow: ringDark }} />

                        <div className="text-center px-4">
                          <div
                            className={[
                              "text-transparent bg-clip-text font-extrabold tracking-wide",
                              isShop ? "text-[18px] sm:text-[20px]" : "text-[14px] sm:text-[15px]",
                              gradientClass(o.gradient),
                              "drop-shadow-[0_10px_22px_rgba(0,0,0,0.60)]",
                            ].join(" ")}
                          >
                            {o.label}
                          </div>

                          <div className="mt-1 text-[11px] font-semibold text-[var(--brand-gold)] drop-shadow-[0_10px_22px_rgba(0,0,0,0.65)]">
                            {isShop ? "Jump in" : "Click to open"}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-[10px] rounded-[22px]"
        aria-hidden="true"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.35), inset 0 0 34px rgba(212,175,55,0.08)",
        }}
      />
    </section>
  );
}