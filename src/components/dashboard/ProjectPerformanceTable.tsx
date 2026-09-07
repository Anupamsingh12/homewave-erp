import { Panel } from "@/components/shared/DetailCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Progress } from "@/components/ui/progress";
import { formatINR, formatNumber } from "@/lib/format";
import type { DashboardSnapshot } from "@/services/analytics.service";

export function ProjectPerformanceTable({
  rows,
}: {
  rows: DashboardSnapshot["projectPerformance"];
}) {
  return (
    <Panel title="Project Performance" description="Sales and collections by project.">
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  "Project",
                  "Units",
                  "Sold",
                  "Available",
                  "Sales Value",
                  "Collected",
                  "Outstanding",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3">{formatNumber(p.total)}</td>
                  <td className="px-4 py-3">{formatNumber(p.sold)}</td>
                  <td className="px-4 py-3">{formatNumber(p.available)}</td>
                  <td className="px-4 py-3">{formatINR(p.salesValue, { compact: true })}</td>
                  <td className="px-4 py-3">{formatINR(p.collected, { compact: true })}</td>
                  <td className="px-4 py-3">{formatINR(p.outstanding, { compact: true })}</td>
                  <td className="w-32 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={p.soldPct} className="h-1.5" />
                      <span className="w-9 shrink-0 text-xs text-muted-foreground">
                        {Math.round(p.soldPct)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No projects yet" description="Project performance will appear here." />
      )}
    </Panel>
  );
}
