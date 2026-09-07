import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PaymentFormDialog } from "@/components/finance/PaymentFormDialog";
import { Button } from "@/components/ui/button";
import { useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { paymentService } from "@/services";
import { formatDate, formatINR } from "@/lib/format";
import type { Payment, PaymentMode } from "@/types";

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});

const PAYMENT_MODES: PaymentMode[] = [
  "BANK_TRANSFER",
  "UPI",
  "CHEQUE",
  "CASH",
  "CARD",
  "NEFT",
  "RTGS",
  "OTHER",
];

function PaymentsPage() {
  const lookups = useLookups();
  const { data: payments, isLoading } = useData(["payments", "all"], paymentService.all);

  const [creating, setCreating] = useState(false);

  const columns: Column<Payment>[] = [
    { key: "code", header: "Receipt Number" },
    {
      key: "paymentDate",
      header: "Payment Date",
      value: (p) => p.paymentDate,
      render: (p) => formatDate(p.paymentDate),
    },
    {
      key: "customerId",
      header: "Customer",
      value: (p) => lookups.customerName(p.customerId),
      render: (p) => lookups.customerName(p.customerId),
    },
    {
      key: "amount",
      header: "Amount",
      value: (p) => p.amount,
      render: (p) => formatINR(p.amount, { compact: true }),
    },
    { key: "mode", header: "Payment Mode", render: (p) => p.mode.replace(/_/g, " ") },
    { key: "reference", header: "Reference" },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusBadge value={p.status} tone={p.status === "PENDING" ? "info" : undefined} />
      ),
    },
  ];

  const filters: FilterDef<Payment>[] = [
    { key: "mode", label: "Mode", options: PAYMENT_MODES, match: (p, v) => p.mode === v },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Every payment received against a demand."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Record Payment
          </Button>
        }
      />
      <DataTable
        rows={payments ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["code", "reference"]}
        filters={filters}
        exportName="payments"
        emptyTitle="No payments recorded yet"
        emptyDescription="Payments recorded against invoices will appear here."
      />

      <PaymentFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
