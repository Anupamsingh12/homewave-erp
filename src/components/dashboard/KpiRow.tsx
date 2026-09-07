import {
  Banknote,
  Building2,
  CalendarCheck,
  ClipboardList,
  HandCoins,
  ReceiptText,
  UserPlus,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { formatINR, formatNumber } from "@/lib/format";
import type { DashboardSnapshot } from "@/services/analytics.service";

export function KpiRow({
  snapshot,
  siteVisitsScheduled,
}: {
  snapshot: DashboardSnapshot;
  siteVisitsScheduled: number;
}) {
  const totalLeads = snapshot.leadFunnel.reduce((sum, s) => sum + s.count, 0);
  const newLeads = snapshot.leadFunnel.find((s) => s.stage === "NEW")?.count ?? 0;
  const collectedThisMonth = snapshot.salesTrend.at(-1)?.collected ?? 0;

  const cards = [
    {
      label: "Total Leads",
      value: formatNumber(totalLeads),
      icon: Users,
      accent: "primary" as const,
    },
    { label: "New Leads", value: formatNumber(newLeads), icon: UserPlus, accent: "info" as const },
    {
      label: "Site Visits",
      value: formatNumber(siteVisitsScheduled),
      icon: ClipboardList,
      accent: "info" as const,
    },
    {
      label: "Bookings This Month",
      value: formatNumber(snapshot.bookingsThisMonth),
      icon: CalendarCheck,
      accent: "success" as const,
    },
    {
      label: "Sales Value",
      value: formatINR(snapshot.salesValue, { compact: true }),
      icon: Banknote,
      accent: "primary" as const,
    },
    {
      label: "Collections This Month",
      value: formatINR(collectedThisMonth, { compact: true }),
      icon: HandCoins,
      accent: "success" as const,
    },
    {
      label: "Outstanding Amount",
      value: formatINR(snapshot.outstanding, { compact: true }),
      icon: ReceiptText,
      accent: snapshot.overdue > 0 ? ("danger" as const) : ("warning" as const),
      ...(snapshot.overdue > 0
        ? { hint: `${formatINR(snapshot.overdue, { compact: true })} overdue` }
        : {}),
    },
    {
      label: "Available Units",
      value: formatNumber(snapshot.inventory.available),
      icon: Building2,
      accent: "info" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} />
      ))}
    </div>
  );
}
