import type { TrustBand } from "@/lib/domain";

const tone: Record<TrustBand, string> = {
  trusted: "bg-[#e5f2ea] text-[#145c3a]",
  review: "bg-[#f4edd9] text-[#7a5410]",
  caution: "bg-[#f8e7d4] text-[#8a3e12]",
  avoid: "bg-[#f8e4e0] text-[#8d2f2a]",
};

export function TrustBadge({
  score,
  band,
  label,
}: {
  score: number;
  band: TrustBand;
  label: string;
}) {
  return (
    <div className={`min-w-[5.5rem] rounded-xl px-3 py-2 text-end ${tone[band]}`}>
      <p className="text-[0.62rem] tracking-[0.16em] uppercase">Trust</p>
      <p className="display text-3xl leading-none tabular-nums">{score}</p>
      <p className="mt-1 text-xs">{label}</p>
    </div>
  );
}
