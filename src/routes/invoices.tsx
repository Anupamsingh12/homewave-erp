import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { InvoiceFormDialog } from "@/components/finance/InvoiceFormDialog";
import { PaymentFormDialog } from "@/components/finance/PaymentFormDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { invoiceService } from "@/services";
import { formatDate, formatINR } from "@/lib/format";
import type { Invoice, InvoiceStatus } from "@/types";

export const Route = createFileRoute("/invoices")({
  component: InvoicesPage,
});

const STATUSES: InvoiceStatus[] = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

function InvoicesPage() {
  const lookups = useLookups();
  const { data: invoices, isLoading } = useData(["invoices", "all"], invoiceService.all);

  const [creating, setCreating] = useState(false);
  const [recordingFor, setRecordingFor] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);

  const remove = useAction(invoiceService.remove, { success: "Draft deleted" });
  const issue = useAction(invoiceService.issue, { success: "Demand raised" });
  const cancel = useAction((id: string) => invoiceService.update(id, { status: "CANCELLED" }), {
    success: "Invoice cancelled",
  });

  const columns: Column<Invoice>[] = [
    { key: "code", header: "Invoice Number" },
    {
      key: "customerId",
      header: "Customer",
      value: (i) => lookups.customerName(i.customerId),
      render: (i) => lookups.customerName(i.customerId),
    },
    { key: "demandType", header: "Demand Type" },
    {
      key: "issueDate",
      header: "Issue Date",
      value: (i) => i.issueDate,
      render: (i) => formatDate(i.issueDate),
    },
    {
      key: "dueDate",
      header: "Due Date",
      value: (i) => i.dueDate,
      render: (i) => formatDate(i.dueDate),
    },
    {
      key: "total",
      header: "Total",
      sortable: false,
      render: (i) => formatINR(invoiceService.summary(i).total, { compact: true }),
    },
    {
      key: "paid",
      header: "Paid",
      sortable: false,
      render: (i) => formatINR(invoiceService.summary(i).paid, { compact: true }),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      sortable: false,
      render: (i) => formatINR(invoiceService.summary(i).outstanding, { compact: true }),
    },
    {
      key: "status",
      header: "Status",
      render: (i) => <StatusBadge value={invoiceService.summary(i).status} />,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (i) => {
        const summary = invoiceService.summary(i);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Invoice actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {i.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => issue.mutate(i.id)}>Issue Demand</DropdownMenuItem>
              )}
              {summary.outstanding > 0 && i.status !== "DRAFT" && i.status !== "CANCELLED" && (
                <DropdownMenuItem onClick={() => setRecordingFor(i)}>
                  Record Payment
                </DropdownMenuItem>
              )}
              {i.status !== "CANCELLED" && i.status !== "PAID" && i.status !== "DRAFT" && (
                <DropdownMenuItem onClick={() => cancel.mutate(i.id)}>Cancel</DropdownMenuItem>
              )}
              {i.status === "DRAFT" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => setDeleting(i)}
                  >
                    Delete draft
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filters: FilterDef<Invoice>[] = [
    {
      key: "status",
      label: "Status",
      options: STATUSES,
      match: (i, v) => invoiceService.summary(i).status === v,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Demands & Invoices"
        description="Payment demands raised against active bookings."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Create Invoice
          </Button>
        }
      />
      <DataTable
        rows={invoices ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["code", "demandType"]}
        filters={filters}
        exportName="invoices"
        emptyTitle="No invoices yet"
        emptyDescription="Invoices are generated automatically from bookings, or create one manually."
      />

      <InvoiceFormDialog open={creating} onOpenChange={setCreating} />
      <PaymentFormDialog
        open={Boolean(recordingFor)}
        onOpenChange={(v) => !v && setRecordingFor(null)}
        invoiceId={recordingFor?.id}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete draft invoice?"
        description="This action cannot be undone."
        confirmLabel="Delete Draft"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
