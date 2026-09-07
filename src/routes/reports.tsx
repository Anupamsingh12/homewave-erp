import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import {
  analyticsService,
  bookingService,
  channelPartnerService,
  commissionService,
  leadService,
  siteVisitService,
} from "@/services";
import type { DashboardSnapshot } from "@/services/analytics.service";
import { formatINR, formatNumber, titleize } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

type ProjectRow = DashboardSnapshot["projectPerformance"][number];

interface SalespersonRow {
  id: string;
  salesperson: string;
  bookings: number;
  salesValue: number;
  collected: number;
}

interface SourceRow {
  id: string;
  source: string;
  leads: number;
  converted: number;
  conversionRate: number;
}

interface PartnerRow {
  id: string;
  company: string;
  leads: number;
  bookings: number;
  salesValue: number;
  commission: number;
}

function ReportsPage() {
  const lookups = useLookups();
  const { data: snapshot } = useData(["dashboard"], analyticsService.dashboard);
  const { data: bookings } = useData(["bookings", "all"], bookingService.all);
  const { data: leads } = useData(["leads", "all"], leadService.all);
  const { data: siteVisits } = useData(["siteVisits", "all"], siteVisitService.all);
  const { data: partners } = useData(["channelPartners", "all"], channelPartnerService.all);
  const { data: commissions } = useData(["commissions", "all"], commissionService.all);

  const salesBySalesperson = useMemo<SalespersonRow[]>(() => {
    const map = new Map<string, { count: number; value: number; collected: number }>();
    for (const b of bookings ?? []) {
      if (b.status === "CANCELLED") continue;
      const slot = map.get(b.salespersonId) ?? { count: 0, value: 0, collected: 0 };
      slot.count += 1;
      slot.value += b.agreementValue;
      slot.collected += bookingService.finance(b.id).paid;
      map.set(b.salespersonId, slot);
    }
    return [...map.entries()].map(([id, v]) => ({
      id,
      salesperson: lookups.userName(id),
      bookings: v.count,
      salesValue: v.value,
      collected: v.collected,
    }));
  }, [bookings, lookups]);

  const crmBySource = useMemo<SourceRow[]>(() => {
    const map = new Map<string, { total: number; converted: number }>();
    for (const l of leads ?? []) {
      const slot = map.get(l.source) ?? { total: 0, converted: 0 };
      slot.total += 1;
      if (l.status === "CONVERTED") slot.converted += 1;
      map.set(l.source, slot);
    }
    return [...map.entries()].map(([source, v]) => ({
      id: source,
      source: titleize(source),
      leads: v.total,
      converted: v.converted,
      conversionRate: v.total ? Math.round((v.converted / v.total) * 100) : 0,
    }));
  }, [leads]);

  const siteVisitConversion = useMemo(() => {
    const rows = siteVisits ?? [];
    const completed = rows.filter((v) => v.status === "COMPLETED").length;
    return rows.length ? Math.round((completed / rows.length) * 100) : 0;
  }, [siteVisits]);

  const partnerPerformance = useMemo<PartnerRow[]>(() => {
    return (partners ?? []).map((p) => {
      const partnerLeads = (leads ?? []).filter((l) => l.channelPartnerId === p.id);
      const partnerBookings = (bookings ?? []).filter((b) => b.channelPartnerId === p.id);
      const salesValue = partnerBookings.reduce((s, b) => s + b.agreementValue, 0);
      const commission = (commissions ?? [])
        .filter((c) => c.channelPartnerId === p.id)
        .reduce((s, c) => s + c.amount, 0);
      return {
        id: p.id,
        company: p.company,
        leads: partnerLeads.length,
        bookings: partnerBookings.length,
        salesValue,
        commission,
      };
    });
  }, [partners, leads, bookings, commissions]);

  const salesByProjectColumns: Column<ProjectRow>[] = [
    { key: "name", header: "Project" },
    { key: "sold", header: "Sold" },
    { key: "available", header: "Available" },
    {
      key: "salesValue",
      header: "Sales Value",
      render: (r) => formatINR(r.salesValue, { compact: true }),
    },
    {
      key: "collected",
      header: "Collected",
      render: (r) => formatINR(r.collected, { compact: true }),
    },
  ];

  const salesBySalespersonColumns: Column<SalespersonRow>[] = [
    { key: "salesperson", header: "Salesperson" },
    { key: "bookings", header: "Bookings" },
    {
      key: "salesValue",
      header: "Sales Value",
      render: (r) => formatINR(r.salesValue, { compact: true }),
    },
    {
      key: "collected",
      header: "Collected",
      render: (r) => formatINR(r.collected, { compact: true }),
    },
  ];

  const inventoryColumns: Column<ProjectRow>[] = [
    { key: "name", header: "Project" },
    { key: "total", header: "Total Units" },
    { key: "available", header: "Available" },
    { key: "sold", header: "Sold" },
    {
      key: "salesValue",
      header: "Inventory Value",
      render: (r) => formatINR(r.salesValue, { compact: true }),
    },
  ];

  const crmColumns: Column<SourceRow>[] = [
    { key: "source", header: "Lead Source" },
    { key: "leads", header: "Leads" },
    { key: "converted", header: "Converted" },
    { key: "conversionRate", header: "Conversion Rate", render: (r) => `${r.conversionRate}%` },
  ];

  const partnerColumns: Column<PartnerRow>[] = [
    { key: "company", header: "Channel Partner" },
    { key: "leads", header: "Leads" },
    { key: "bookings", header: "Bookings" },
    {
      key: "salesValue",
      header: "Sales Value",
      render: (r) => formatINR(r.salesValue, { compact: true }),
    },
    {
      key: "commission",
      header: "Commission",
      render: (r) => formatINR(r.commission, { compact: true }),
    },
  ];

  const projectRows: ProjectRow[] = snapshot?.projectPerformance ?? [];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Export-ready summaries across sales, inventory, and CRM."
      />

      <Tabs defaultValue="sales">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="partners">Channel Partners</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Sales by Project</h3>
            <DataTable
              rows={projectRows}
              columns={salesByProjectColumns}
              searchFields={["name"]}
              exportName="sales-by-project"
              emptyTitle="No sales data yet"
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Sales by Salesperson</h3>
            <DataTable
              rows={salesBySalesperson}
              columns={salesBySalespersonColumns}
              searchFields={["salesperson"]}
              exportName="sales-by-salesperson"
              emptyTitle="No bookings yet"
            />
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <DataTable
            rows={projectRows}
            columns={inventoryColumns}
            searchFields={["name"]}
            exportName="inventory-report"
            emptyTitle="No inventory data yet"
          />
        </TabsContent>

        <TabsContent value="crm" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Overall conversion rate:{" "}
            <span className="font-medium text-foreground">
              {snapshot ? Math.round(snapshot.conversionRate) : 0}%
            </span>{" "}
            · Site visit conversion:{" "}
            <span className="font-medium text-foreground">{siteVisitConversion}%</span> · Total
            leads:{" "}
            <span className="font-medium text-foreground">
              {formatNumber((leads ?? []).length)}
            </span>
          </p>
          <DataTable
            rows={crmBySource}
            columns={crmColumns}
            searchFields={["source"]}
            exportName="crm-by-source"
            emptyTitle="No leads yet"
          />
        </TabsContent>

        <TabsContent value="partners">
          <DataTable
            rows={partnerPerformance}
            columns={partnerColumns}
            searchFields={["company"]}
            exportName="channel-partner-performance"
            emptyTitle="No channel partners yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
