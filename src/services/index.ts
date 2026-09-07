import { createCrudService, logActivity } from "./crud";
import { ApiError, getDb, nextCode, nextId, nowIso, request } from "./api/client";
import {
  bookingFinance,
  customerFinance,
  customerLedger,
  invoiceTotal,
  paymentStatusOf,
  projectStats,
  releaseExpiredHolds,
  summarizeInvoice,
  unitTotal,
} from "./derive";
import type { Agreement, Booking, Commission, Invoice, Payment, Unit } from "@/types";

export { leadService } from "./leads.service";
export { analyticsService } from "./analytics.service";

export const userService = createCrudService("users", {
  idPrefix: "usr",
  searchFields: ["name", "email", "phone"],
});

export const followUpService = createCrudService("followUps", {
  idPrefix: "flw",
  codePrefix: "FU-",
  codeStart: 5001,
  searchFields: ["title", "code", "notes"],
});

export const siteVisitService = createCrudService("siteVisits", {
  idPrefix: "svt",
  codePrefix: "SV-",
  codeStart: 6001,
  searchFields: ["code", "notes"],
});

export const customerService = {
  ...createCrudService("customers", {
    idPrefix: "cus",
    codePrefix: "CUST-",
    codeStart: 2001,
    searchFields: ["name", "phone", "email", "code", "city"],
    guardDelete: (row, db) =>
      db.bookings.some((b) => b.customerId === row.id)
        ? "Customer has bookings and cannot be deleted."
        : null,
  }),
  finance: customerFinance,
  ledger: customerLedger,
};

export const projectService = {
  ...createCrudService("projects", {
    idPrefix: "prj",
    codePrefix: "PRJ-",
    codeStart: 101,
    searchFields: ["name", "city", "code", "developer", "reraNumber"],
    guardDelete: (row, db) =>
      db.bookings.some((b) => b.projectId === row.id)
        ? "Project has bookings. Archive it instead."
        : null,
  }),
  stats: projectStats,
};

export const towerService = createCrudService("towers", {
  idPrefix: "twr",
  codePrefix: "TWR-",
  codeStart: 201,
  searchFields: ["name", "code"],
  guardDelete: (row, db) =>
    db.units.some((u) => u.towerId === row.id) ? "Tower still has units." : null,
});

export const paymentPlanService = createCrudService("paymentPlans", {
  idPrefix: "pln",
  codePrefix: "PP-",
  codeStart: 401,
  searchFields: ["name", "code", "description"],
});

export const channelPartnerService = createCrudService("channelPartners", {
  idPrefix: "cpt",
  codePrefix: "CP-",
  codeStart: 701,
  searchFields: ["company", "contactPerson", "phone", "email", "code", "city"],
});

export const constructionService = createCrudService("constructionMilestones", {
  idPrefix: "cms",
  searchFields: ["name", "notes"],
});

export const documentService = createCrudService("documents", {
  idPrefix: "doc",
  searchFields: ["name"],
});

export const agreementService = createCrudService("agreements", {
  idPrefix: "agr",
  codePrefix: "AGR-",
  codeStart: 901,
  searchFields: ["code", "notes"],
});

export const commissionService = createCrudService("commissions", {
  idPrefix: "com",
  codePrefix: "CM-",
  codeStart: 801,
  searchFields: ["code"],
});

/* ------------------------------------------------------------------ units */

const unitBase = createCrudService("units", {
  idPrefix: "unt",
  codePrefix: "U-",
  codeStart: 1,
  searchFields: ["code", "facing"],
  guardDelete: (row) =>
    row.status === "BOOKED" || row.status === "SOLD"
      ? "Booked or sold units cannot be deleted."
      : null,
});

export const unitService = {
  ...unitBase,
  async all() {
    releaseExpiredHolds();
    return unitBase.all();
  },
  async list(query?: Parameters<typeof unitBase.list>[0]) {
    releaseExpiredHolds();
    return unitBase.list(query);
  },
  hold(
    id: string,
    input: { customerId: string; salespersonId: string; hours: number; reason: string },
  ) {
    return request(`/units/${id}/hold`, () => {
      const db = getDb();
      const unit = db.units.find((u) => u.id === id);
      if (!unit) throw new ApiError("Unit not found", 404);
      if (unit.status !== "AVAILABLE") throw new ApiError("Only available units can be held", 409);
      const until = new Date(Date.now() + input.hours * 3_600_000).toISOString();
      Object.assign(unit, {
        status: "HOLD" as const,
        holdCustomerId: input.customerId,
        holdSalespersonId: input.salespersonId,
        holdUntil: until,
        holdReason: input.reason,
        updatedAt: nowIso(),
      });
      logActivity("UNIT", unit.id, "Unit held", `${unit.code} held for ${input.hours}h`);
      return unit as Unit;
    });
  },
  release(id: string) {
    return request(`/units/${id}/release`, () => {
      const db = getDb();
      const unit = db.units.find((u) => u.id === id);
      if (!unit) throw new ApiError("Unit not found", 404);
      Object.assign(unit, {
        status: "AVAILABLE" as const,
        holdCustomerId: null,
        holdSalespersonId: null,
        holdUntil: null,
        holdReason: null,
        updatedAt: nowIso(),
      });
      logActivity("UNIT", unit.id, "Hold released", `${unit.code} back to available`);
      return unit as Unit;
    });
  },
  block(id: string, reason: string) {
    return request(`/units/${id}/block`, () => {
      const db = getDb();
      const unit = db.units.find((u) => u.id === id);
      if (!unit) throw new ApiError("Unit not found", 404);
      if (unit.status === "BOOKED" || unit.status === "SOLD")
        throw new ApiError("Unit is already sold or booked", 409);
      unit.status = unit.status === "BLOCKED" ? "AVAILABLE" : "BLOCKED";
      unit.holdReason = reason;
      unit.updatedAt = nowIso();
      logActivity("UNIT", unit.id, "Availability changed", `${unit.code} → ${unit.status}`);
      return unit as Unit;
    });
  },
  total: unitTotal,
};

/* --------------------------------------------------------------- bookings */

const bookingBase = createCrudService("bookings", {
  idPrefix: "bkg",
  codePrefix: "BK-",
  codeStart: 4001,
  searchFields: ["code", "notes"],
  guardDelete: (row, db) =>
    db.payments.some((p) => p.bookingId === row.id)
      ? "Payments exist against this booking. Cancel it instead."
      : null,
});

export interface BookingInput {
  customerId: string;
  projectId: string;
  towerId: string;
  unitId: string;
  bookingDate: string;
  bookingAmount: number;
  agreementValue: number;
  salespersonId: string;
  channelPartnerId: string | null;
  paymentPlanId: string | null;
  notes: string;
}

export const bookingService = {
  ...bookingBase,
  create(input: Partial<BookingInput>) {
    return request("/bookings", () => {
      const db = getDb();
      const unit = db.units.find((u) => u.id === input.unitId);
      if (!unit) throw new ApiError("Select a unit", 400);
      if (unit.status === "BOOKED" || unit.status === "SOLD")
        throw new ApiError(`Unit ${unit.code} is no longer available`, 409);

      const booking: Booking = {
        id: nextId("bkg"),
        code: nextCode("BK-", db.bookings, 4001),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        customerId: input.customerId!,
        projectId: unit.projectId,
        towerId: unit.towerId,
        unitId: unit.id,
        bookingDate: input.bookingDate ?? nowIso(),
        bookingAmount: input.bookingAmount ?? 0,
        agreementValue: input.agreementValue ?? 0,
        status: "CONFIRMED",
        salespersonId: input.salespersonId!,
        channelPartnerId: input.channelPartnerId ?? null,
        paymentPlanId: input.paymentPlanId ?? null,
        notes: input.notes ?? "",
      };
      db.bookings.unshift(booking);
      unit.status = "BOOKED";
      unit.holdUntil = null;
      unit.holdCustomerId = null;
      unit.updatedAt = nowIso();

      // Generate the demand schedule from the selected payment plan.
      const plan = db.paymentPlans.find((p) => p.id === booking.paymentPlanId);
      if (plan) {
        plan.milestones.forEach((m, idx) => {
          const due = new Date(booking.bookingDate);
          due.setMonth(due.getMonth() + idx * 2);
          const invoice: Invoice = {
            id: nextId("inv"),
            code: nextCode("INV-", db.invoices, 7001),
            createdAt: nowIso(),
            updatedAt: nowIso(),
            bookingId: booking.id,
            customerId: booking.customerId,
            unitId: booking.unitId,
            demandType: m.name,
            issueDate: idx === 0 ? booking.bookingDate : due.toISOString(),
            dueDate: due.toISOString(),
            amount: Math.round((booking.agreementValue * m.percentage) / 100),
            taxRate: 5,
            status: idx === 0 ? "ISSUED" : "DRAFT",
            notes: `Auto-generated from ${plan.name}`,
          };
          db.invoices.push(invoice);
        });
      }

      // Channel-partner commission accrual.
      if (booking.channelPartnerId) {
        const cp = db.channelPartners.find((c) => c.id === booking.channelPartnerId);
        if (cp) {
          const commission: Commission = {
            id: nextId("com"),
            code: nextCode("CM-", db.commissions, 801),
            createdAt: nowIso(),
            updatedAt: nowIso(),
            bookingId: booking.id,
            channelPartnerId: cp.id,
            percentage: cp.commissionPct,
            amount: Math.round((booking.agreementValue * cp.commissionPct) / 100),
            status: "PENDING",
            paidAmount: 0,
          };
          db.commissions.unshift(commission);
        }
      }

      logActivity(
        "BOOKING",
        booking.id,
        "Booking created",
        `${booking.code} for unit ${unit.code}`,
      );
      return booking;
    });
  },
  cancel(id: string, reason: string) {
    return request(`/bookings/${id}/cancel`, () => {
      const db = getDb();
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) throw new ApiError("Booking not found", 404);
      booking.status = "CANCELLED";
      booking.updatedAt = nowIso();
      const unit = db.units.find((u) => u.id === booking.unitId);
      if (unit) unit.status = "AVAILABLE";
      db.invoices
        .filter((i) => i.bookingId === id && i.status !== "PAID")
        .forEach((i) => (i.status = "CANCELLED"));
      db.commissions.filter((c) => c.bookingId === id).forEach((c) => (c.status = "CANCELLED"));
      logActivity("BOOKING", id, "Booking cancelled", reason || "Cancelled by admin");
      return booking;
    });
  },
  generateAgreement(bookingId: string) {
    return request("/agreements", () => {
      const db = getDb();
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new ApiError("Booking not found", 404);
      const existing = db.agreements.find((a) => a.bookingId === bookingId);
      if (existing) return existing;
      const agreement: Agreement = {
        id: nextId("agr"),
        code: nextCode("AGR-", db.agreements, 901),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        bookingId,
        agreementDate: nowIso(),
        agreementValue: booking.agreementValue,
        status: "GENERATED",
        notes: "",
      };
      db.agreements.unshift(agreement);
      logActivity("AGREEMENT", agreement.id, "Agreement generated", agreement.code);
      return agreement;
    });
  },
  finance: bookingFinance,
  paymentStatus: (bookingId: string) => paymentStatusOf(bookingFinance(bookingId)),
};

/* --------------------------------------------------------------- invoices */

const invoiceBase = createCrudService("invoices", {
  idPrefix: "inv",
  codePrefix: "INV-",
  codeStart: 7001,
  searchFields: ["code", "demandType"],
  guardDelete: (row, db) =>
    db.payments.some((p) => p.invoiceId === row.id) ? "Invoice has payments." : null,
});

export const invoiceService = {
  ...invoiceBase,
  issue(id: string) {
    return request(`/invoices/${id}/issue`, () => {
      const db = getDb();
      const inv = db.invoices.find((i) => i.id === id);
      if (!inv) throw new ApiError("Invoice not found", 404);
      if (inv.status !== "DRAFT") throw new ApiError("Only drafts can be issued", 409);
      inv.status = "ISSUED";
      inv.issueDate = nowIso();
      inv.updatedAt = nowIso();
      logActivity("INVOICE", id, "Demand raised", `${inv.code} issued`);
      return inv;
    });
  },
  summary: summarizeInvoice,
  total: invoiceTotal,
};

/* --------------------------------------------------------------- payments */

const paymentBase = createCrudService("payments", {
  idPrefix: "pay",
  codePrefix: "PAY-",
  codeStart: 8001,
  searchFields: ["code", "reference"],
});

export const paymentService = {
  ...paymentBase,
  create(data: Partial<Payment>) {
    return request("/payments", () => {
      const db = getDb();
      const invoice = data.invoiceId ? db.invoices.find((i) => i.id === data.invoiceId) : null;
      if (invoice) {
        const s = summarizeInvoice(invoice);
        if ((data.amount ?? 0) > s.outstanding + 1)
          throw new ApiError("Amount exceeds the invoice outstanding balance", 400);
      }
      const payment: Payment = {
        id: nextId("pay"),
        code: nextCode("PAY-", db.payments, 8001),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        invoiceId: data.invoiceId ?? null,
        bookingId: data.bookingId ?? invoice?.bookingId ?? "",
        customerId: data.customerId ?? invoice?.customerId ?? "",
        paymentDate: data.paymentDate ?? nowIso(),
        amount: data.amount ?? 0,
        mode: data.mode ?? "BANK_TRANSFER",
        reference: data.reference ?? "",
        status: data.status ?? "SUCCESS",
        notes: data.notes ?? "",
      };
      db.payments.unshift(payment);
      if (invoice) {
        const s = summarizeInvoice(invoice);
        invoice.status = s.status;
        invoice.updatedAt = nowIso();
      }
      // A fully-collected booking marks the unit as sold.
      if (payment.bookingId) {
        const f = bookingFinance(payment.bookingId);
        if (f.agreementValue > 0 && f.paid >= f.agreementValue) {
          const b = db.bookings.find((x) => x.id === payment.bookingId);
          const u = db.units.find((x) => x.id === b?.unitId);
          if (b && u) {
            b.status = "COMPLETED";
            u.status = "SOLD";
          }
        }
      }
      logActivity("PAYMENT", payment.id, "Payment received", `${payment.code} recorded`);
      return payment;
    });
  },
};

/* ------------------------------------------------------------- activities */

export const activityService = {
  recent(limit = 20) {
    return request("/activities", () => getDb().activities.slice(0, limit));
  },
  forEntity(entityId: string) {
    return request(`/activities/${entityId}`, () =>
      getDb().activities.filter((a) => a.entityId === entityId),
    );
  },
};
