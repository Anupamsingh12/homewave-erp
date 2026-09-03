import { cn } from "@/lib/utils";
import { titleize } from "@/lib/format";

type Tone = "neutral" | "info" | "success" | "warn" | "danger" | "accent";

const TONE_MAP: Record<string, Tone> = {
  // leads
  NEW: "info",
  CONTACTED: "info",
  SITE_VISIT: "accent",
  QUALIFIED: "accent",
  NEGOTIATION: "warn",
  CONVERTED: "success",
  LOST: "danger",
  // units
  AVAILABLE: "success",
  HOLD: "warn",
  BOOKED: "info",
  SOLD: "accent",
  BLOCKED: "danger",
  // bookings / generic
  PENDING: "warn",
  CONFIRMED: "success",
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
  DELAYED: "danger",
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
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info: "bg-info-soft text-info ring-info/25",
  success: "bg-success-soft text-success ring-success/25",
  warn: "bg-warning-soft text-warning ring-warning/25",
  danger: "bg-destructive/10 text-destructive ring-destructive/25",
  accent: "bg-accent-soft text-accent-strong ring-accent-strong/25",
};

export function StatusBadge({
  value,
  className,
  dot = true,
}: {
  value?: string | null;
  className?: string;
  dot?: boolean;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = TONE_MAP[value] ?? "neutral";
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
