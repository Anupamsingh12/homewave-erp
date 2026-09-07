import { cn } from "@/lib/utils";
import { titleize } from "@/lib/format";

export type Tone =
  "neutral" | "info" | "success" | "warn" | "danger" | "accent" | "purple" | "cyan" | "orange";

const TONE_MAP: Record<string, Tone> = {
  // leads
  NEW: "info",
  CONTACTED: "purple",
  SITE_VISIT: "warn",
  QUALIFIED: "cyan",
  NEGOTIATION: "orange",
  CONVERTED: "success",
  LOST: "danger",
  // units
  AVAILABLE: "success",
  HOLD: "warn",
  BOOKED: "info",
  SOLD: "purple",
  BLOCKED: "danger",
  // bookings / generic
  PENDING: "warn",
  CONFIRMED: "info",
  CANCELLED: "danger",
  COMPLETED: "success",
  // invoices
  DRAFT: "neutral",
  ISSUED: "info",
  PARTIALLY_PAID: "warn",
  PAID: "success",
  OVERDUE: "danger",
  // agreements
  GENERATED: "info",
  SENT: "accent",
  SIGNED: "success",
  // projects / milestones
  PLANNING: "neutral",
  ACTIVE: "info",
  ON_TRACK: "success",
  DELAYED: "warn",
  NOT_STARTED: "neutral",
  IN_PROGRESS: "info",
  // misc
  SCHEDULED: "info",
  NO_SHOW: "danger",
  OPEN: "warn",
  ELIGIBLE: "info",
  APPROVED: "accent",
  SUCCESS: "success",
  FAILED: "danger",
  VERIFIED: "success",
  REJECTED: "danger",
  HIGH: "danger",
  MEDIUM: "warn",
  LOW: "neutral",
  INACTIVE: "neutral",
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info: "bg-info-soft text-info ring-info/25",
  success: "bg-success-soft text-success ring-success/25",
  warn: "bg-warning-soft text-warning ring-warning/25",
  danger: "bg-destructive/10 text-destructive ring-destructive/25",
  accent: "bg-accent-soft text-accent-strong ring-accent-strong/25",
  purple: "bg-purple-soft text-purple ring-purple/25",
  cyan: "bg-cyan-soft text-cyan ring-cyan/25",
  orange: "bg-orange-soft text-orange ring-orange/25",
};

export function StatusBadge({
  value,
  className,
  dot = true,
  tone: toneOverride,
}: {
  value?: string | null;
  className?: string;
  dot?: boolean;
  /** Force a specific tone instead of looking it up by value — use when the same
   * status string means different things in different contexts (e.g. a booking's
   * PENDING is amber, but a payment's PENDING is blue). */
  tone?: Tone | undefined;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = toneOverride ?? TONE_MAP[value] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {titleize(value)}
    </span>
  );
}
