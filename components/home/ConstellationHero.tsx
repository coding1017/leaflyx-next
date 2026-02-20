"use client";

import React, { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrbDef = {
  id: string;
  label: string;
  href: string;
  d: number; // base diameter in px (scaled responsively)
  gradient: "goldToEmerald" | "emeraldToGold";
  xPct: number;
  yPct: number;
};

type SimOrb = {
  id: string;
  href: string;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tvx: number;
  tvy: number;
  nextWanderAt: number;
  seedA: number;
  seedB: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function haloForGradient(g: OrbDef["gradient"]) {
  return g === "goldToEmerald"
    ? {
        tube: "rgba(209,255,235,0.20)",
        core: "rgba(16,185,129,0.90)",
        mid: "rgba(16,185,129,0.52)",
        wide: "rgba(16,185,129,0.20)",
        shadow: "rgba(16,185,129,0.52)",
      }
    : {
        tube: "rgba(255,255,255,0.20)",
        core: "rgba(255,244,200,0.92)",
        mid: "rgba(245,215,122,0.96)",
        wide: "rgba(212,175,55,0.38)",
        shadow: "rgba(245,215,122,0.92)",
      };
}

function gradientClass(g: OrbDef["gradient"]) {
  return g === "goldToEmerald"
    ? "bg-gradient-to-r from-[var(--brand-gold)] via-[#F5D77A] to-emerald-300"
    : "bg-gradient-to-r from-emerald-300 via-[#F5D77A] to-[var(--brand-gold)]";
}

export default function ConstellationHero() {
  const router = useRouter();

  const wrapRef = useRef<HTMLElement | null>(null);
  const plateRef = useRef<HTMLDivElement | null>(null);
  const orbNodesRef = useRef<Record<string, HTMLDivElement | null>>({});

  // spotlight (mouse only)
  const rafSpotRef = useRef<number | null>(null);
  const lastXY = useRef({ x: 50, y: 45 });

  // physics
  const rafSimRef = useRef<number | null>(null);
  const simRef = useRef<{
    ready: boolean;
    w: number;
    h: number;
    pad: number;
    wallPad: number;
    orbs: SimOrb[];
    lastT: number;
    // speed tuning
    speedMult: number;
  }>({
    ready: false,
    w: 0,
    h: 0,
    pad: 12,
    wallPad: 22,
    orbs: [],
    lastT: 0,
    speedMult: 1.0,
  });

  const orbDefs: OrbDef[] = useMemo(() => {
  const cats: Omit<OrbDef, "xPct" | "yPct">[] = [
    // Shop base matches concentrates base
    { id: "shop", label: "Shop", href: "/products", d: 156, gradient: "goldToEmerald" },

    { id: "flower", label: "Flower", href: "/category/flower", d: 142, gradient: "emeraldToGold" },
    { id: "smalls", label: "Smalls", href: "/category/smalls", d: 120, gradient: "goldToEmerald" },
    { id: "vapes", label: "Vapes", href: "/category/vapes", d: 124, gradient: "emeraldToGold" },
    { id: "edibles", label: "Edibles", href: "/category/edibles", d: 140, gradient: "goldToEmerald" },

    // Beverages stays untouched
    { id: "beverages", label: "Beverages", href: "/category/beverages", d: 122, gradient: "emeraldToGold" },

    { id: "pre", label: "Pre-rolls", href: "/category/pre-rolls", d: 138, gradient: "goldToEmerald" },
    { id: "conc", label: "Concentrates", href: "/category/concentrates", d: 156, gradient: "emeraldToGold" },
  ];

  const layout = [
    { xPct: 40, yPct: 54 }, // shop
    { xPct: 28, yPct: 28 }, // flower
    { xPct: 50, yPct: 24 }, // smalls
    { xPct: 76, yPct: 30 }, // vapes
    { xPct: 64, yPct: 56 }, // edibles
    { xPct: 32, yPct: 78 }, // beverages
    { xPct: 74, yPct: 76 }, // pre
    { xPct: 52, yPct: 80 }, // concentrates
  ];

  const shrink = 0.92; // 8% reduction (middle ground)

  return cats.map((c, i) => {
    let newSize = c.d;

    // Shrink everyone except beverages
    if (c.id !== "beverages") {
      newSize = Math.round(c.d * shrink);
    }

    // Concentrates slight boost for label fit
    if (c.id === "conc") {
      newSize = Math.round(newSize * 1.05);
    }

    // Shop slightly more dominant (3–4% larger than concentrates)
    if (c.id === "shop") {
      newSize = Math.round(newSize * 1.09);
    }

    return {
      ...c,
      d: newSize,
      xPct: layout[i]?.xPct ?? 50,
      yPct: layout[i]?.yPct ?? 50,
    };
  });
}, []);

  // ✅ Mouse spotlight: ignores touch scrolling
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;

      const r = el.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 100;
      const py = ((e.clientY - r.top) / r.height) * 100;

      lastXY.current = { x: clamp(px, 0, 100), y: clamp(py, 0, 100) };

      if (rafSpotRef.current) return;
      rafSpotRef.current = window.requestAnimationFrame(() => {
        rafSpotRef.current = null;
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

    el.style.setProperty("--mx", `50%`);
    el.style.setProperty("--my", `45%`);

    return () => {
      el.removeEventListener("pointermove", onMove as any);
      el.removeEventListener("pointerleave", onLeave as any);
      if (rafSpotRef.current) cancelAnimationFrame(rafSpotRef.current);
      rafSpotRef.current = null;
    };
  }, []);

  function paint(orbs: SimOrb[]) {
    for (const o of orbs) {
      const node = orbNodesRef.current[o.id];
      if (!node) continue;
      const tx = o.x - o.r;
      const ty = o.y - o.r;
      node.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0px)`;
      node.style.width = `${(o.r * 2).toFixed(0)}px`;
      node.style.height = `${(o.r * 2).toFixed(0)}px`;
    }
  }

  function resolveCollisions(orbs: SimOrb[], pad: number, applyImpulse = false) {
    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        const a = orbs[i];
        const b = orbs[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;

        const minDist = a.r + b.r + pad;
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = minDist - dist;
        const push = overlap * 0.5;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;

        if (applyImpulse) {
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;
          if (velAlongNormal < 0) {
            const restitution = 0.92;
            const jImpulse = -(1 + restitution) * velAlongNormal * 0.5;
            const ix = jImpulse * nx;
            const iy = jImpulse * ny;
            a.vx -= ix;
            a.vy -= iy;
            b.vx += ix;
            b.vy += iy;
          }
        }
      }
    }
  }

  function contain(orbs: SimOrb[], w: number, h: number, wallPad: number, bounce = false) {
    for (const o of orbs) {
      const left = wallPad + o.r;
      const right = w - wallPad - o.r;
      const top = wallPad + o.r;
      const bottom = h - wallPad - o.r;

      if (o.x < left) {
        o.x = left;
        if (bounce) o.vx = Math.abs(o.vx) * 0.95;
      } else if (o.x > right) {
        o.x = right;
        if (bounce) o.vx = -Math.abs(o.vx) * 0.95;
      }

      if (o.y < top) {
        o.y = top;
        if (bounce) o.vy = Math.abs(o.vy) * 0.95;
      } else if (o.y > bottom) {
        o.y = bottom;
        if (bounce) o.vy = -Math.abs(o.vy) * 0.95;
      }
    }
  }

  // ✅ build / rebuild sim on plate resize
  useEffect(() => {
    const plate = plateRef.current;
    if (!plate) return;

    const rebuild = () => {
      const r = plate.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);

      const minSide = Math.min(w, h);

      // baseline scaling
      let scale = minSide / 520;
      if (minSide >= 520) scale *= 1.05;
      if (minSide <= 380) scale *= 1.14;
      scale = clamp(scale, 0.80, 1.22);

      // ✅ slightly more free space between orbs
      const pad = clamp(minSide * 0.022, 12, 18);

      // ✅ wall padding
      const wallPad = clamp(minSide * 0.065, 20, 34);

      // ✅ speed multiplier: quicker overall drift
      // (keeps it smooth; just faster)
      const speedMult = minSide <= 400 ? 1.18 : 1.28;

      const now = performance.now();

      const simOrbs: SimOrb[] = orbDefs.map((d, i) => {
        const dScaled = clamp(d.d * scale, 98, 190);
        const r0 = dScaled / 2;

        const x0 = wallPad + (d.xPct / 100) * (w - wallPad * 2);
        const y0 = wallPad + (d.yPct / 100) * (h - wallPad * 2);

        // ✅ faster base speed (px/s)
        const base = clamp(minSide * 0.020, 11, 18) * speedMult;
        const angle = (i / orbDefs.length) * Math.PI * 2 + (i % 2 ? 0.6 : -0.35);
        const vx = Math.cos(angle) * base;
        const vy = Math.sin(angle) * base;

        const seedA = (i + 1) * 123.456;
        const seedB = (i + 1) * 78.91;

        return {
          id: d.id,
          href: d.href,
          r: r0,
          x: x0,
          y: y0,
          vx,
          vy,
          tvx: vx,
          tvy: vy,
          nextWanderAt: now + 520 + i * 95, // ✅ changes sooner
          seedA,
          seedB,
        };
      });

      simRef.current = {
        ready: true,
        w,
        h,
        pad,
        wallPad,
        orbs: simOrbs,
        lastT: performance.now(),
        speedMult,
      };

      // relax so they start non-overlapping
      for (let k = 0; k < 40; k++) {
        resolveCollisions(simRef.current.orbs, simRef.current.pad);
        contain(simRef.current.orbs, w, h, wallPad);
      }

      paint(simRef.current.orbs);
    };

    const ro = new ResizeObserver(() => rebuild());
    ro.observe(plate);
    rebuild();

    return () => ro.disconnect();
  }, [orbDefs]);

  // ✅ simulation loop
  useEffect(() => {
    const step = (t: number) => {
      const sim = simRef.current;
      if (!sim.ready) {
        rafSimRef.current = requestAnimationFrame(step);
        return;
      }

      const dtMs = t - sim.lastT;
      sim.lastT = t;
      const dt = clamp(dtMs / 1000, 0.008, 0.030);

      const { w, h, wallPad, pad, speedMult } = sim;

      // ✅ quicker, more alive movement
      const maxSpeed = clamp(Math.min(w, h) * 0.12, 72, 118) * speedMult;
      const wanderLerp = 0.06; // faster “direction chasing”
      const friction = 0.995;

      // ✅ jitter bigger so it's less patterned, still smooth
      const jitterAmp = clamp(Math.min(w, h) * 0.0042, 1.2, 2.6) * speedMult;

      for (const o of sim.orbs) {
        if (t >= o.nextWanderAt) {
          const mag = clamp(Math.min(w, h) * 0.052, 26, 48) * speedMult;
          const ang = Math.random() * Math.PI * 2;
          o.tvx = Math.cos(ang) * mag;
          o.tvy = Math.sin(ang) * mag;

          // ✅ change targets more often
          o.nextWanderAt = t + 520 + Math.random() * 780;
        }

        const jx = Math.sin((t / 1000) * (0.95 + (o.seedA % 0.6)) + o.seedA) * jitterAmp;
        const jy = Math.cos((t / 1000) * (1.15 + (o.seedB % 0.7)) + o.seedB) * jitterAmp;

        o.tvx += jx * dt;
        o.tvy += jy * dt;

        o.vx += (o.tvx - o.vx) * wanderLerp;
        o.vy += (o.tvy - o.vy) * wanderLerp;

        const sp = Math.hypot(o.vx, o.vy);
        if (sp > maxSpeed) {
          const s = maxSpeed / sp;
          o.vx *= s;
          o.vy *= s;
        }

        o.x += o.vx * dt;
        o.y += o.vy * dt;

        o.vx *= friction;
        o.vy *= friction;
      }

      resolveCollisions(sim.orbs, pad, true);
      contain(sim.orbs, w, h, wallPad, true);
      paint(sim.orbs);

      rafSimRef.current = requestAnimationFrame(step);
    };

    rafSimRef.current = requestAnimationFrame(step);
    return () => {
      if (rafSimRef.current) cancelAnimationFrame(rafSimRef.current);
      rafSimRef.current = null;
    };
  }, []);

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

            {/* ✅ Smaller Shop CTA for space */}
            <div className="mt-7 flex flex-col gap-3">
              <button
                onClick={() => router.push("/products")}
                className="
                  inline-flex items-center justify-center
                  rounded-full px-4 py-2
                  font-extrabold text-[14px] sm:text-[15px]
                  text-black bg-[var(--brand-gold)]
                  border border-black/70
                  shadow-[0_16px_38px_rgba(212,175,55,0.42)]
                  hover:brightness-105 active:brightness-95
                  transition w-fit
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
                  transition w-fit
                "
                style={{ touchAction: "manipulation" }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-gold)] via-[#F5D77A] to-emerald-300 font-extrabold tracking-wide">
                  View COA (Certificate of Analysis)
                </span>
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="relative min-h-[380px] sm:min-h-[440px] lg:min-h-[500px]">
            <div
              ref={plateRef}
              className="
                absolute inset-0 rounded-[24px]
                border border-[rgba(212,175,55,0.35)]
                bg-black/25
                sm:bg-black/20 sm:backdrop-blur-[10px]
                shadow-[inset_0_0_0_1px_rgba(0,0,0,0.75)]
                overflow-hidden
              "
            >
              {orbDefs.map((o) => {
                const isShop = o.id === "shop";
                const halo = haloForGradient(o.gradient);

                const ringGold =
                  "inset 0 0 0 1px rgba(212,175,55,0.60), inset 0 0 26px rgba(212,175,55,0.16)";
                const ringDark = "inset 0 0 0 2px rgba(0,0,0,0.78)";

                // ✅ slightly smaller font for “Concentrates” only, so it always fits
                const labelClass =
                  o.id === "conc"
                    ? (isShop ? "text-[18px] sm:text-[20px]" : "text-[13px] sm:text-[14px]")
                    : isShop
                      ? "text-[18px] sm:text-[20px]"
                      : "text-[14px] sm:text-[15px]";

                return (
                  <div
                    key={o.id}
                    ref={(node) => {
                      orbNodesRef.current[o.id] = node;
                    }}
                    className="absolute left-0 top-0 will-change-transform"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -inset-6 rounded-full pointer-events-none opacity-95"
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
                      className="absolute -inset-10 rounded-full pointer-events-none opacity-65"
                      style={{
                        background: `radial-gradient(circle at 50% 60%, ${halo.wide} 0%, transparent 70%)`,
                        filter: "blur(22px)",
                        mixBlendMode: "normal",
                      }}
                    />

                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        router.push(o.href);
                      }}
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
                            labelClass,
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
                );
              })}
            </div>
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