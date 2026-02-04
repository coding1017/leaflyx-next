import Link from "next/link";

type Props = {
  href: string;
  className?: string;
};

export default function CoaVerifiedPill({ href, className = "" }: Props) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        `
        inline-flex items-center gap-1.5
        rounded-full px-3 py-1 text-[11px] font-semibold
        bg-black/80 border border-[var(--brand-gold)]
        hover:bg-black
        hover:shadow-[0_0_12px_rgba(212,175,55,0.45)]
        transition
        `,
        className,
      ].join(" ")}
    >
      <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
        COA Verified
      </span>

      {/* external icon cue */}
      <svg
        viewBox="0 0 24 24"
        className="w-3 h-3 text-[var(--brand-gold)] opacity-80"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z"
        />
        <path
          fill="currentColor"
          d="M5 5h6v2H7v10h10v-4h2v6H5V5z"
        />
      </svg>
    </Link>
  );
}
