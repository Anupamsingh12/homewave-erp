import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatINR(value: number, opts?: { compact?: boolean }): string {
  if (!Number.isFinite(value)) return "₹0";
  if (opts?.compact) return `₹${compactINR(value)}`;
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

export function compactINR(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `${(value / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)} K`;
  return `${Math.round(value)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy, hh:mm a");
  } catch {
    return "—";
  }
}

export function formatTime(value?: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "hh:mm a");
  } catch {
    return "—";
  }
}

export function fromNow(value?: string | null): string {
  if (!value) return "—";
  try {
    return `${formatDistanceToNowStrict(parseISO(value))} ago`;
  } catch {
    return "—";
  }
}

export function titleize(value?: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function countdown(target: string, from: Date): string {
  const ms = parseISO(target).getTime() - from.getTime();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
