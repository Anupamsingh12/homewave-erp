import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { endOfMonth, endOfWeek } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/DetailCard";
import { KpiCard } from "@/components/shared/KpiCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useData } from "@/hooks/use-erp";
import { analyticsService, invoiceService } from "@/services";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/collections")({
  component: CollectionsPage,
});

const AGING_LABELS: Record<string, string> = {
  "0-30": "0–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
};

function CollectionsPage() {
  const { data: snapshot, isLoading } = useData(["dashboard"], analyticsService.dashboard);
  const { data: invoices } = useData(["invoices", "all"], invoiceService.all);

  const dueSoon = useMemo(() => {
    const now = new Date();
    const weekEnd = endOfWeek(now).getTime();
    const monthEnd = endOfMonth(now).getTime();
    let dueThisWeek = 0;
    let dueThisMonth = 0;
    for (const inv of invoices ?? []) {
      const summary = invoiceService.summary(inv);
      if (summary.outstanding <= 0) continue;
      const due = new Date(inv.dueDate).getTime();
      if (due <= monthEnd) dueThisMonth += summary.outstanding;
      if (due <= weekEnd) dueThisWeek += summary.outstanding;
    }
    return { dueThisWeek, dueThisMonth };
  }, [invoices]);

  if (isLoading || !snapshot) {
    return (
      <div>
        <PageHeader title="Collections" />
        <EmptyState title="Loading…" />
      </div>
    );
  }

  const totalReceivable = snapshot.collected + snapshot.outstanding;

  return (
    <div className="space-y-6">
      <PageHeader title="Collections" description="Cash flow health across every active booking." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Receivable" value={formatINR(totalReceivable, { compact: true })} />
        <KpiCard
          label="Collected"
          value={formatINR(snapshot.collected, { compact: true })}
          accent="success"
        />
        <KpiCard
          label="Outstanding"
          value={formatINR(snapshot.outstanding, { compact: true })}
          accent="warning"
        />
        <KpiCard
          label="Overdue"
          value={formatINR(snapshot.overdue, { compact: true })}
          accent="danger"
        />
        <KpiCard label="Due This Week" value={formatINR(dueSoon.dueThisWeek, { compact: true })} />
        <KpiCard
          label="Due This Month"
          value={formatINR(dueSoon.dueThisMonth, { compact: true })}
        />
      </div>

      <Panel title="Overdue Aging">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {snapshot.collectionsAging.map((bucket) => (
            <div key={bucket.bucket} className="rounded-lg border border-border p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {AGING_LABELS[bucket.bucket] ?? bucket.bucket}
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatINR(bucket.amount, { compact: true })}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Outstanding by Project">
        {snapshot.projectPerformance.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Project", "Sales Value", "Collected", "Outstanding"].map((h) => (
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
                {snapshot.projectPerformance.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3">{formatINR(p.salesValue, { compact: true })}</td>
                    <td className="px-4 py-3">{formatINR(p.collected, { compact: true })}</td>
                    <td className="px-4 py-3">{formatINR(p.outstanding, { compact: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No projects yet" />
        )}
      </Panel>
    </div>
  );
}
