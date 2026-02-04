import confetti from "canvas-confetti";

function reduceMotionEnabled() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

/**
 * Leaflyx-style, PREMIUM but NOTICEABLE confetti burst
 * Bigger, brighter, longer — without feeling cheap.
 * Used for add-to-cart actions.
 */
export function leaflyxAddToCartConfetti() {
  if (typeof window === "undefined") return;
  if (reduceMotionEnabled()) return;

  const origin = { x: 0.92, y: 0.1 }; // top-right near cart

  // 🎉 Burst 1 — strong initial pop
  confetti({
    particleCount: 80,
    spread: 85,
    startVelocity: 48,
    gravity: 0.9,
    scalar: 1.25,
    ticks: 220,
    origin,
    colors: ["#D8B34A", "#F2D27C", "#0B3B2E", "#0F5A45"],
  });

  // ✨ Burst 2 — shimmer fill
  window.setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      startVelocity: 38,
      gravity: 1.0,
      scalar: 1.15,
      ticks: 200,
      origin,
      colors: ["#F2D27C", "#0F5A45"],
    });
  }, 110);

  // 🌟 Burst 3 — trailing sparkle
  window.setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 120,
      startVelocity: 26,
      gravity: 1.15,
      scalar: 0.95,
      ticks: 180,
      origin,
      colors: ["#D8B34A"],
    });
  }, 220);
}

/**
 * Leaflyx-style RESUBSCRIBE celebration
 * Same premium multi-burst choreography,
 * fired from BOTH sides for a "welcome back" moment.
 */
export function leaflyxResubscribeConfetti() {
  if (typeof window === "undefined") return;
  if (reduceMotionEnabled()) return;

  const fire = (origin: { x: number; y: number }) => {
    // 🎉 Burst 1 — strong initial pop
    confetti({
      particleCount: 80,
      spread: 85,
      startVelocity: 48,
      gravity: 0.9,
      scalar: 1.25,
      ticks: 220,
      origin,
      colors: ["#D8B34A", "#F2D27C", "#0B3B2E", "#0F5A45"],
    });

    // ✨ Burst 2 — shimmer fill
    window.setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 100,
        startVelocity: 38,
        gravity: 1.0,
        scalar: 1.15,
        ticks: 200,
        origin,
        colors: ["#F2D27C", "#0F5A45"],
      });
    }, 110);

    // 🌟 Burst 3 — trailing sparkle
    window.setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 120,
        startVelocity: 26,
        gravity: 1.15,
        scalar: 0.95,
        ticks: 180,
        origin,
        colors: ["#D8B34A"],
      });
    }, 220);
  };

  // 🔥 Fire from BOTH sides simultaneously
  fire({ x: 0.08, y: 0.1 }); // top-left
  fire({ x: 0.92, y: 0.1 }); // top-right
}
