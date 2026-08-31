import { getDb } from "./api/client";
import type { Invoice, InvoiceStatus, Unit } from "@/types";

export function unitTotal(unit: Unit): number {
  const sub = unit.basePrice + unit.plc + unit.parking + unit.floorRise + unit.otherCharges;
  return Math.round(sub * 1.05);
}

export function invoiceTotal(invoice: Invoice): number {
  return Math.round(invoice.amount * (1 + invoice.taxRate / 100));
}

export function invoicePaid(invoiceId: string): number {
  return getDb()
    .payments.filter((p) => p.invoiceId === invoiceId && p.status === "SUCCESS")
    .reduce((s, p) => s + p.amount, 0);
}

export function computeInvoiceStatus(invoice: Invoice, at = new Date()): InvoiceStatus {
  if (invoice.status === "DRAFT" || invoice.status === "CANCELLED") return invoice.status;
  const total = invoiceTotal(invoice);
  const paid = invoicePaid(invoice.id);
  if (paid >= total) return "PAID";
  const overdue = new Date(invoice.dueDate).getTime() < at.getTime();
  if (paid > 0) return overdue ? "OVERDUE" : "PARTIALLY_PAID";
  return overdue ? "OVERDUE" : "ISSUED";
}

export interface InvoiceSummary {
  total: number;
  paid: number;
  outstanding: number;
  status: InvoiceStatus;
}

export function summarizeInvoice(invoice: Invoice): InvoiceSummary {
  const total = invoiceTotal(invoice);
  const paid = invoicePaid(invoice.id);
  return {
    total,
    paid,
    outstanding: Math.max(0, total - paid),
    status: computeInvoiceStatus(invoice),
  };
}

export interface BookingFinance {
  agreementValue: number;
  demanded: number;
  paid: number;
  due: number;
  overdue: number;
}

export function bookingFinance(bookingId: string): BookingFinance {
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === bookingId);
  const invoices = db.invoices.filter((i) => i.bookingId === bookingId && i.status !== "CANCELLED");
  let demanded = 0;
  let paid = 0;
  let overdue = 0;
  for (const inv of invoices) {
    const s = summarizeInvoice(inv);
    demanded += s.total;
    paid += s.paid;
    if (s.status === "OVERDUE") overdue += s.outstanding;
  }
  return {
    agreementValue: booking?.agreementValue ?? 0,
    demanded,
    paid,
    due: Math.max(0, demanded - paid),
    overdue,
  };
}

export function customerFinance(customerId: string): BookingFinance {
  const db = getDb();
  const bookings = db.bookings.filter(
    (b) => b.customerId === customerId && b.status !== "CANCELLED",
  );
  return bookings.reduce<BookingFinance>(
    (acc, b) => {
      const f = bookingFinance(b.id);
      return {
        agreementValue: acc.agreementValue + f.agreementValue,
        demanded: acc.demanded + f.demanded,
        paid: acc.paid + f.paid,
        due: acc.due + f.due,
        overdue: acc.overdue + f.overdue,
      };
    },
    { agreementValue: 0, demanded: 0, paid: 0, due: 0, overdue: 0 },
  );
}

export interface LedgerRow {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export function customerLedger(customerId: string): LedgerRow[] {
  const db = getDb();
  const rows: Omit<LedgerRow, "balance">[] = [];
  db.invoices
    .filter((i) => i.customerId === customerId && i.status !== "DRAFT" && i.status !== "CANCELLED")
    .forEach((i) =>
      rows.push({
        id: i.id,
        date: i.issueDate,
        description: `Demand — ${i.demandType} (${i.code})`,
        debit: invoiceTotal(i),
        credit: 0,
      }),
    );
  db.payments
    .filter((p) => p.customerId === customerId && p.status === "SUCCESS")
    .forEach((p) =>
      rows.push({
        id: p.id,
        date: p.paymentDate,
        description: `Payment received (${p.code})`,
        debit: 0,
        credit: p.amount,
      }),
    );
  rows.sort((a, b) => a.date.localeCompare(b.date));
  let balance = 0;
  return rows.map((r) => {
    balance += r.debit - r.credit;
    return { ...r, balance };
  });
}

export function projectStats(projectId: string) {
  const db = getDb();
  const units = db.units.filter((u) => u.projectId === projectId);
  const bookings = db.bookings.filter((b) => b.projectId === projectId && b.status !== "CANCELLED");
  const finance = bookings.reduce(
    (acc, b) => {
      const f = bookingFinance(b.id);
      return {
        salesValue: acc.salesValue + b.agreementValue,
        collected: acc.collected + f.paid,
        outstanding: acc.outstanding + f.due,
      };
    },
    { salesValue: 0, collected: 0, outstanding: 0 },
  );
  return {
    total: units.length,
    available: units.filter((u) => u.status === "AVAILABLE").length,
    hold: units.filter((u) => u.status === "HOLD").length,
    booked: units.filter((u) => u.status === "BOOKED").length,
    sold: units.filter((u) => u.status === "SOLD").length,
    blocked: units.filter((u) => u.status === "BLOCKED").length,
    bookings: bookings.length,
    ...finance,
  };
}

/** Holds that have expired revert to AVAILABLE, mirroring backend business logic. */
export function releaseExpiredHolds() {
  const db = getDb();
  const now = Date.now();
  db.units.forEach((u) => {
    if (u.status === "HOLD" && u.holdUntil && new Date(u.holdUntil).getTime() < now) {
      u.status = "AVAILABLE";
      u.holdUntil = null;
      u.holdCustomerId = null;
      u.holdSalespersonId = null;
      u.holdReason = null;
    }
  });
}
