import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: number;
  accent?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info-soft text-info",
  }[accent];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {typeof trend === "number" && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  trend >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
          </div>
        </div>
        {Icon && (
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", accentClass)}>
            <Icon className="size-4.5" />
          </div>
        )}
      </div>
    </div>
  );
}
