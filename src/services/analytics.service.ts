import { getDb, request } from "./api/client";
import { bookingFinance, projectStats, summarizeInvoice } from "./derive";

export interface DashboardSnapshot {
  salesValue: number;
  collected: number;
  outstanding: number;
  overdue: number;
  bookingsThisMonth: number;
  bookingsTotal: number;
  leadsOpen: number;
  conversionRate: number;
  inventory: { available: number; hold: number; booked: number; sold: number; blocked: number };
  salesTrend: { month: string; bookings: number; value: number; collected: number }[];
  projectPerformance: {
    id: string;
    name: string;
    total: number;
    sold: number;
    booked: number;
    available: number;
    salesValue: number;
    collected: number;
    outstanding: number;
    soldPct: number;
  }[];
  leadFunnel: { stage: string; count: number }[];
  sourceMix: { source: string; count: number }[];
  collectionsAging: { bucket: string; amount: number }[];
  upcoming: { id: string; title: string; due: string; kind: string }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const analyticsService = {
  dashboard(): Promise<DashboardSnapshot> {
    return request("/analytics/dashboard", () => {
      const db = getDb();
      const now = new Date();
      const activeBookings = db.bookings.filter((b) => b.status !== "CANCELLED");

      let salesValue = 0;
      let collected = 0;
      let outstanding = 0;
      let overdue = 0;
      for (const b of activeBookings) {
        const f = bookingFinance(b.id);
        salesValue += b.agreementValue;
        collected += f.paid;
        outstanding += f.due;
        overdue += f.overdue;
      }

      const trendMap = new Map<string, { bookings: number; value: number; collected: number }>();
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        trendMap.set(`${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, {
          bookings: 0,
          value: 0,
          collected: 0,
        });
      }
      const label = (iso: string) => {
        const d = new Date(iso);
        return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      };
      for (const b of activeBookings) {
        const key = label(b.bookingDate);
        const slot = trendMap.get(key);
        if (slot) {
          slot.bookings += 1;
          slot.value += b.agreementValue;
        }
      }
      for (const p of db.payments.filter((x) => x.status === "SUCCESS")) {
        const slot = trendMap.get(label(p.paymentDate));
        if (slot) slot.collected += p.amount;
      }

      const funnelStages = [
        "NEW",
        "CONTACTED",
        "SITE_VISIT",
        "QUALIFIED",
        "NEGOTIATION",
        "CONVERTED",
        "LOST",
      ];
      const sourceCounts = new Map<string, number>();
      db.leads.forEach((l) => sourceCounts.set(l.source, (sourceCounts.get(l.source) ?? 0) + 1));

      const aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 } as Record<string, number>;
      for (const inv of db.invoices) {
        const s = summarizeInvoice(inv);
        if (s.status !== "OVERDUE" || s.outstanding <= 0) continue;
        const days = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86_400_000);
        const bucket = days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
        aging[bucket] += s.outstanding;
      }

      const upcoming = [
        ...db.followUps
          .filter((f) => f.status === "OPEN")
          .map((f) => ({ id: f.id, title: f.title, due: f.dueAt, kind: "Follow-up" })),
        ...db.siteVisits
          .filter((v) => v.status === "SCHEDULED")
          .map((v) => ({ id: v.id, title: `Site visit ${v.code}`, due: v.visitAt, kind: "Site visit" })),
      ]
        .sort((a, b) => a.due.localeCompare(b.due))
        .slice(0, 6);

      const converted = db.leads.filter((l) => l.status === "CONVERTED").length;

      return {
        salesValue,
        collected,
        outstanding,
        overdue,
        bookingsThisMonth: activeBookings.filter((b) => {
          const d = new Date(b.bookingDate);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
        bookingsTotal: activeBookings.length,
        leadsOpen: db.leads.filter((l) => l.status !== "CONVERTED" && l.status !== "LOST").length,
        conversionRate: db.leads.length ? (converted / db.leads.length) * 100 : 0,
        inventory: {
          available: db.units.filter((u) => u.status === "AVAILABLE").length,
          hold: db.units.filter((u) => u.status === "HOLD").length,
          booked: db.units.filter((u) => u.status === "BOOKED").length,
          sold: db.units.filter((u) => u.status === "SOLD").length,
          blocked: db.units.filter((u) => u.status === "BLOCKED").length,
        },
        salesTrend: [...trendMap.entries()].map(([month, v]) => ({ month, ...v })),
        projectPerformance: db.projects.map((p) => {
          const s = projectStats(p.id);
          return {
            id: p.id,
            name: p.name,
            total: s.total,
            sold: s.sold,
            booked: s.booked,
            available: s.available,
            salesValue: s.salesValue,
            collected: s.collected,
            outstanding: s.outstanding,
            soldPct: s.total ? ((s.sold + s.booked) / s.total) * 100 : 0,
          };
        }),
        leadFunnel: funnelStages.map((stage) => ({
          stage,
          count: db.leads.filter((l) => l.status === stage).length,
        })),
        sourceMix: [...sourceCounts.entries()].map(([source, count]) => ({ source, count })),
        collectionsAging: Object.entries(aging).map(([bucket, amount]) => ({ bucket, amount })),
        upcoming,
      };
    });
  },
};
