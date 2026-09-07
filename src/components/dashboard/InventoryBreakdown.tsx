import { Panel } from "@/components/shared/DetailCard";
import { formatNumber } from "@/lib/format";
import type { DashboardSnapshot } from "@/services/analytics.service";

const SEGMENTS: {
  key: keyof DashboardSnapshot["inventory"];
  label: string;
  bar: string;
  dot: string;
}[] = [
  { key: "available", label: "Available", bar: "bg-success", dot: "bg-success" },
  { key: "hold", label: "Hold", bar: "bg-warning", dot: "bg-warning" },
  { key: "booked", label: "Booked", bar: "bg-info", dot: "bg-info" },
  { key: "sold", label: "Sold", bar: "bg-purple", dot: "bg-purple" },
  { key: "blocked", label: "Blocked", bar: "bg-destructive", dot: "bg-destructive" },
];

export function InventoryBreakdown({ inventory }: { inventory: DashboardSnapshot["inventory"] }) {
  const total = Object.values(inventory).reduce((s, v) => s + v, 0) || 1;

  return (
    <Panel title="Inventory" description="Unit status across every active project.">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {SEGMENTS.map((s) => {
          const value = inventory[s.key];
          if (!value) return null;
          return (
            <div
              key={s.key}
              className={`h-full ${s.bar}`}
              style={{ width: `${(value / total) * 100}%` }}
              title={`${s.label}: ${value}`}
            />
          );
        })}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className={`size-2.5 shrink-0 rounded-full ${s.dot}`} />
            <div>
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="text-sm font-semibold text-foreground">
                {formatNumber(inventory[s.key])}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
