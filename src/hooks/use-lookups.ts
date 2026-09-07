import { useMemo } from "react";
import { useData } from "./use-erp";
import {
  channelPartnerService,
  customerService,
  leadService,
  paymentPlanService,
  projectService,
  towerService,
  unitService,
  userService,
} from "@/services";

/** Shared reference data used across screens (names for foreign keys, pickers). */
export function useLookups() {
  const users = useData(["users", "all"], userService.all);
  const projects = useData(["projects", "all"], projectService.all);
  const towers = useData(["towers", "all"], towerService.all);
  const units = useData(["units", "all"], unitService.all);
  const customers = useData(["customers", "all"], customerService.all);
  const partners = useData(["channelPartners", "all"], channelPartnerService.all);
  const plans = useData(["paymentPlans", "all"], paymentPlanService.all);
  const leads = useData(["leads", "all"], leadService.all);

  return useMemo(() => {
    const map = <T extends { id: string }>(rows: T[] | undefined) =>
      new Map((rows ?? []).map((r) => [r.id, r] as const));
    const userMap = map(users.data);
    const projectMap = map(projects.data);
    const towerMap = map(towers.data);
    const unitMap = map(units.data);
    const customerMap = map(customers.data);
    const partnerMap = map(partners.data);
    const planMap = map(plans.data);
    const leadMap = map(leads.data);

    const customerName = (id?: string | null) => (id && customerMap.get(id)?.name) || "—";
    const leadName = (id?: string | null) => (id && leadMap.get(id)?.name) || "—";

    return {
      users: users.data ?? [],
      projects: projects.data ?? [],
      towers: towers.data ?? [],
      units: units.data ?? [],
      customers: customers.data ?? [],
      partners: partners.data ?? [],
      plans: plans.data ?? [],
      leads: leads.data ?? [],
      loading:
        users.isLoading ||
        projects.isLoading ||
        towers.isLoading ||
        units.isLoading ||
        customers.isLoading ||
        leads.isLoading,
      userName: (id?: string | null) => (id && userMap.get(id)?.name) || "—",
      projectName: (id?: string | null) => (id && projectMap.get(id)?.name) || "—",
      towerName: (id?: string | null) => (id && towerMap.get(id)?.name) || "—",
      unit: (id?: string | null) => (id ? unitMap.get(id) : undefined),
      unitCode: (id?: string | null) => (id && unitMap.get(id)?.code) || "—",
      customerName,
      partnerName: (id?: string | null) => (id && partnerMap.get(id)?.company) || "Direct",
      planName: (id?: string | null) => (id && planMap.get(id)?.name) || "—",
      leadName,
      relatedName: (row: { leadId: string | null; customerId: string | null }) =>
        row.customerId ? customerName(row.customerId) : leadName(row.leadId),
    };
  }, [users, projects, towers, units, customers, partners, plans, leads]);
}
