import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { LeadFunnelChart } from "@/components/dashboard/LeadFunnelChart";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { InventoryBreakdown } from "@/components/dashboard/InventoryBreakdown";
import { ProjectPerformanceTable } from "@/components/dashboard/ProjectPerformanceTable";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useData } from "@/hooks/use-erp";
import { activityService, analyticsService, siteVisitService } from "@/services";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: snapshot, isLoading } = useData(["dashboard"], analyticsService.dashboard);
  const { data: activities } = useData(["activities", "recent"], () => activityService.recent(8));
  const { data: siteVisits } = useData(["siteVisits", "all"], siteVisitService.all);

  const siteVisitsScheduled = (siteVisits ?? []).filter((v) => v.status === "SCHEDULED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your builder ERP at a glance — pipeline, inventory, and cash flow."
      />
      <QuickActions />

      {isLoading || !snapshot ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <KpiRow snapshot={snapshot} siteVisitsScheduled={siteVisitsScheduled} />

          <div className="grid gap-6 xl:grid-cols-2">
            <SalesTrendChart data={snapshot.salesTrend} />
            <LeadFunnelChart data={snapshot.leadFunnel} />
          </div>

          <InventoryBreakdown inventory={snapshot.inventory} />
          <ProjectPerformanceTable rows={snapshot.projectPerformance} />
          <RecentActivityFeed items={activities ?? []} />
        </>
      )}
    </div>
  );
}
