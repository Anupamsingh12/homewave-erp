import { createCrudService, logActivity } from "./crud";
import { getDb, nextCode, nextId, nowIso, request } from "./api/client";
import type { Customer, Lead, LeadStatus } from "@/types";

const base = createCrudService("leads", {
  idPrefix: "led",
  codePrefix: "LD-",
  codeStart: 3001,
  searchFields: ["name", "phone", "email", "code"],
  beforeCreate: (draft) =>
    logActivity("LEAD", draft.id, "Lead created", `${draft.name} added to pipeline`),
});

export const leadService = {
  ...base,
  async changeStatus(id: string, status: LeadStatus): Promise<Lead> {
    const lead = await base.update(id, { status });
    logActivity("LEAD", id, "Status changed", `Lead moved to ${status.replace(/_/g, " ")}`);
    return lead;
  },
  async convert(id: string): Promise<Customer> {
    return request("/leads/convert", () => {
      const db = getDb();
      const lead = db.leads.find((l) => l.id === id);
      if (!lead) throw new Error("Lead not found");
      const existing = db.customers.find((c) => c.leadId === id);
      if (existing) return existing;
      const customer: Customer = {
        id: nextId("cus"),
        code: nextCode("CUST-", db.customers, 2001),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        pan: "",
        address: "",
        city: "",
        source: lead.source,
        assignedToId: lead.assignedToId,
        leadId: lead.id,
      };
      db.customers.unshift(customer);
      lead.status = "CONVERTED";
      lead.updatedAt = nowIso();
      logActivity(
        "LEAD",
        lead.id,
        "Converted",
        `${lead.name} converted to customer ${customer.code}`,
      );
      return customer;
    });
  },
};
