const aed = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

const day = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatAed(amount: number): string {
  return aed.format(amount);
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return day.format(new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)));
}

export function bedsLabel(beds: number): string {
  if (beds === 0) return "Studio";
  if (beds === 1) return "1 bedroom";
  return `${beds} bedrooms`;
}

export function bedsShort(beds: number): string {
  if (beds === 0) return "Studio";
  return `${beds}BR`;
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1 + months, d ?? 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function nextFirstOfMonth(from = new Date()): string {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const dt = new Date(Date.UTC(y, m + 1, 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

export function percentDelta(price: number, median: number): number {
  return Math.round(((price - median) / median) * 1000) / 10;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
