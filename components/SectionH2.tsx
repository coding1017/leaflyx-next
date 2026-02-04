// components/SectionH2.tsx

import type { ReactNode } from "react";

type SectionH2Props = {
  children: ReactNode;
  className?: string;
  /** "center" matches COA, "left" is nice for category pages */
  align?: "left" | "center";
};

export default function SectionH2({
  children,
  className = "",
  align = "center",
}: SectionH2Props) {
  const isLeft = align === "left";

  const textAlign = isLeft ? "text-left" : "text-center";
  const lineAlign = isLeft ? "ml-0" : "mx-auto";
  const wrapAlign = isLeft ? "items-start text-left" : "items-center text-center";

  return (
    <div
      className={[
        "my-10 flex flex-col gap-2",
        wrapAlign,
        "overflow-visible", // lets the glow breathe a bit
        className,
      ].join(" ")}
    >
      {/* H2 – EXACTLY the same as COA */}
      <h2
        className={[
          "text-2xl md:text-4xl font-extrabold",
          textAlign,
          "mb-4 md:mb-6",
          "text-white tracking-wide",
          // COA glow:
          "[text-shadow:_0_0_12px_rgba(212,175,55,0.9),_0_0_28px_rgba(212,175,55,0.85),_0_0_56px_rgba(212,175,55,0.75)]",
          "drop-shadow-[0_0_40px_rgba(212,175,55,0.8)]",
        ].join(" ")}
      >
        {children}
      </h2>

      {/* COA line – exactly what you pasted */}
      <div
        className={[
          "h-[2px] w-16 md:w-24",
          lineAlign,
          "mb-6 md:mb-10",
          "bg-[var(--brand-gold)] opacity-80",
          "rounded-full",
          "shadow-[0_0_16px_rgba(212,175,55,0.8)]",
        ].join(" ")}
        aria-hidden="true"
      />
    </div>
  );
}
