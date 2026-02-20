"use client";

import React, { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function haloForGradient(g: Orb["gradient"]) {
  return g === "goldToEmerald"
    ? {
        // gold→emerald text => emerald halo
        tube: "rgba(209,255,235,0.20)",
        core: "rgba(16,185,129,0.90)",
        mid: "rgba(16,185,129,0.52)",
        wide: "rgba(16,185,129,0.20)",
        shadow: "rgba(16,185,129,0.52)",
      }
    : {
        // emerald→gold text => stronger gold halo (less washed)
        tube: "rgba(255,255,255,0.20)",
        core: "rgba(255,244,200,0.90)",
        mid: "rgba(245,215,122,0.92)",
        wide: "rgba(212,175,55,0.34)",
        shadow: "rgba(245,215,122,0.86)",
      };
}

function gradientClass(g: Orb["gradient"]) {
  return g === "goldToEmerald"
    ? "bg-gradient-to-r from-[var(--brand-gold)] via-[#F5D77A] to-emerald-300"
    : "bg-gradient-to-r from-emerald-300 via-[#F5D77A] to-[var(--brand-gold)]";
}

export default function ConstellationHero() {
  const router = useRouter();

  const wrapRef = useRef<HTMLElement | null>(null);
  const plateRef = useRef<HTMLDivElement | null>(null);

  // spotlight RAF
  const spotRafRef = useRef<number | null>(null);
  const lastXY = useRef({ x: 50, y: 45 });

  // anchor refs (the absolute wrapper that positions each orb at x/y)
  const orbAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ✅ Mouse-only spotlight: no React state, ignores touch scrolling.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;

      const r = el.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 100;
      const py = ((e.clientY - r.top) / r.height) * 100;

      lastXY.current = {
        x: Math.max(0, Math.min(100, px)),
        y: Math.max(0, Math.min(100, py)),
      };

      if (spotRafRef.current) return;
      spotRafRef.current = window.requestAnimationFrame(() => {
        spotRafRef.current = null;
        el.style.setProperty("--mx", `${lastXY.current.x}%`);
        el.style.setProperty("--my", `${lastXY.current.y}%`);
      });
    };

    const onLeave = () => {
      el.style.setProperty("--mx", `50%`);
      el.style.setProperty("--my", `45%`);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });

    // init
    el.style.setProperty("--mx", `50%`);
    el.style.setProperty("--my", `45%`);

    return () => {
      el.removeEventListener("pointermove", onMove as any);
      el.removeEventListener("pointerleave", onLeave as any);
      if (spotRafRef.current) cancelAnimationFrame(spotRafRef.current);
      spotRafRef.current = null;
    };
  }, []);

  const orbs: Orb[] = useMemo(() => {
    const cats = [
      { id: "shop", label: "Shop", href: "/products", size: 150 },
      { id: "flower", label: "Flower", href: "/category/flower", size: 118 },
      { id: "smalls", label: "Smalls", href: "/category/smalls", size: 105 },
      { id: "vapes", label: "Vapes", href: "/category/vapes", size: 110 },
      { id: "edibles", label: "Edibles", href: "/category/edibles", size: 115 },

      // ✅ start beverages farther bottom-left so it's less likely to get buried
      { id: "beverages", label: "Beverages", href: "/category/beverages", size: 102 },

      { id: "pre", label: "Pre-rolls", href: "/category/pre-rolls", size: 115 },
      { id: "conc", label: "Concentrates", href: "/category/concentrates", size: 118 },
    ];

    // NOTE: only changed beverages default position to the open pocket.
    const layout = [
      { x: 26, y: 56 }, // shop
      { x: 18, y: 28 }, // flower
      { x: 50, y: 24 }, // smalls
      { x: 82, y: 30 }, // vapes
      { x: 64, y: 54 }, // edibles
      { x: 30, y: 86 }, // beverages ✅ moved down-left
      { x: 78, y: 74 }, // pre
      { x: 56, y: 78 }, // conc
    ];

    // Irregular wander amplitudes / durations
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
        drift: { dx: d.dx, dy: d.dy, dur: d.dur, delay: -(i * 0.65) },
      };
    });
  }, []);

  // ✅ Non-overlap relaxation (one-time / resize) — preserves your CSS movement & visuals
  useEffect(() => {
    const plate = plateRef.current;
    if (!plate) return;

    let raf: number | null = null;

    const relaxLayout = () => {
      const pr = plate.getBoundingClientRect();
      const w = pr.width;
      const h = pr.height;

      // collect current % positions from style (orbs[] base)
      const nodes = orbs
        .map((o) => {
          const el = orbAnchorRefs.current[o.id];
          if (!el) return null;
          return {
            id: o.id,
            size: o.size,
            r: o.size / 2,
            // start from base % layout
            x: (o.x / 100) * w,
            y: (o.y / 100) * h,
            el,
          };
        })
        .filter(Boolean) as Array<{ id: string; size: number; r: number; x: number; y: number; el: HTMLDivElement }>;

      if (nodes.length === 0) return;

      // keep inside plate
      const pad = 14;
      const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

      // iterative separation (cheap; only 8 orbs)
      const iters = 34;
      const gap = 10; // desired gap between orbs

      for (let k = 0; k < iters; k++) {
        let moved = false;

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const minDist = a.r + b.r + gap;

            if (dist < minDist) {
              const nx = dx / dist;
              const ny = dy / dist;
              const push = (minDist - dist) * 0.52; // softness factor

              // push both away
              a.x -= nx * push;
              a.y -= ny * push;
              b.x += nx * push;
              b.y += ny * push;
              moved = true;
            }
          }
        }

        // keep inside bounds each pass
        for (const n of nodes) {
          n.x = clamp(n.x, n.r + pad, w - n.r - pad);
          n.y = clamp(n.y, n.r + pad, h - n.r - pad);
        }

        if (!moved) break;
      }

      // write back as % offsets via CSS vars so animations remain untouched
      for (const n of nodes) {
        const px = (n.x / w) * 100;
        const py = (n.y / h) * 100;
        n.el.style.left = `${px}%`;
        n.el.style.top = `${py}%`;
      }
    };

    // run after paint so layout is stable
    raf = window.requestAnimationFrame(relaxLayout);

    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(relaxLayout);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
  }, [orbs]);

  return (
    <section
      ref={(node) => {
        wrapRef.current = node;
      }}
      className="
        relative overflow-hidden rounded-[28px]
        border-2 border-[rgba(212,175,55,0.75)]
        bg-black
        shadow-[0_0_0_1px_rgba(0,0,0,0.75),_0_22px_70px_rgba(0,0,0,0.60),_0_0_46px_rgba(212,175,55,0.25)]
      "
      style={
        {
          ["--mx" as any]: "50%",
          ["--my" as any]: "45%",
        } as React.CSSProperties
      }
    >
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

      {/* Background */}
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

      {/* Mouse spotlight */}
      <div
        className="absolute inset-0 opacity-[0.60]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(560px 430px at var(--mx) var(--my), rgba(245,215,122,0.16), transparent 62%)," +
            "radial-gradient(640px 460px at calc(var(--mx) + 4%) calc(var(--my) + 7%), rgba(16,185,129,0.14), transparent 64%)",
        }}
      />

      <div className="relative px-5 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          {/* Left */}
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

            <div className="mt-7 flex flex-col gap-3">
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
                style={{ touchAction: "manipulation" }}
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
                style={{ touchAction: "manipulation" }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-gold)] via-[#F5D77A] to-emerald-300 font-extrabold tracking-wide">
                  View COA (Certificate of Analysis)
                </span>
              </Link>
            </div>
          </div>

          {/* Right constellation */}
          <div className="relative min-h-[380px] sm:min-h-[440px] lg:min-h-[500px]">
            <div
              ref={plateRef}
              className="
                absolute inset-0 rounded-[24px]
                border border-[rgba(212,175,55,0.35)]
                bg-black/25
                sm:bg-black/20 sm:backdrop-blur-[10px]
                shadow-[inset_0_0_0_1px_rgba(0,0,0,0.75)]
              "
            />

            {orbs.map((o, idx) => {
              const isShop = o.id === "shop";
              const halo = haloForGradient(o.gradient);

              const ringGold =
                "inset 0 0 0 1px rgba(212,175,55,0.60), inset 0 0 26px rgba(212,175,55,0.16)";
              const ringDark = "inset 0 0 0 2px rgba(0,0,0,0.78)";

              const wanderName = idx % 2 === 0 ? "orbWanderA" : "orbWanderB";

              return (
                <div
                  key={o.id}
                  ref={(node) => {
                    orbAnchorRefs.current[o.id] = node;
                  }}
                  className="absolute"
                  style={{
                    left: `${o.x}%`,
                    top: `${o.y}%`,
                    width: o.size,
                    height: o.size,
                    transform: "translate(-50%, -50%)",
                  }}
                >
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
                      <div
                        aria-hidden="true"
                        className="absolute -inset-6 rounded-full pointer-events-none opacity-90 sm:opacity-100"
                        style={{
                          background: `radial-gradient(circle at 50% 56%,
                            ${halo.tube} 0%,
                            ${halo.core} 12%,
                            ${halo.mid} 26%,
                            ${halo.wide} 44%,
                            transparent 66%)`,
                          filter: "blur(16px)",
                          mixBlendMode: "normal",
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute -inset-10 rounded-full pointer-events-none opacity-70"
                        style={{
                          background: `radial-gradient(circle at 50% 60%, ${halo.wide} 0%, transparent 70%)`,
                          filter: "blur(22px)",
                          mixBlendMode: "normal",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => router.push(o.href)}
                        className="relative grid place-items-center rounded-full select-none w-full h-full"
                        style={{
                          touchAction: "manipulation",
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
                          backdropFilter: "none",
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