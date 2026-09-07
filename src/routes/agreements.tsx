import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AgreementFormDialog } from "@/components/sales/AgreementFormDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { agreementService, bookingService } from "@/services";
import { formatDate, formatINR, titleize } from "@/lib/format";
import type { Agreement, AgreementStatus } from "@/types";

export const Route = createFileRoute("/agreements")({
  component: AgreementsPage,
});

const STATUSES: AgreementStatus[] = ["DRAFT", "GENERATED", "SENT", "SIGNED", "CANCELLED"];

function AgreementsPage() {
  const lookups = useLookups();
  const { data: agreements, isLoading } = useData(["agreements", "all"], agreementService.all);
  const { data: bookings } = useData(["bookings", "all"], bookingService.all);

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Agreement | null>(null);

  const remove = useAction(agreementService.remove, { success: "Draft deleted" });
  const changeStatus = useAction(
    (input: { id: string; status: AgreementStatus }) =>
      agreementService.update(input.id, { status: input.status }),
    { success: "Agreement status updated" },
  );

  const bookingOf = (bookingId: string) => (bookings ?? []).find((b) => b.id === bookingId);

  const columns: Column<Agreement>[] = [
    { key: "code", header: "Agreement Number" },
    {
      key: "bookingId",
      header: "Booking",
      value: (a) => bookingOf(a.bookingId)?.code ?? "",
      render: (a) => bookingOf(a.bookingId)?.code ?? "—",
    },
    {
      key: "customer",
      header: "Customer",
      sortable: false,
      render: (a) => lookups.customerName(bookingOf(a.bookingId)?.customerId),
    },
    {
      key: "unit",
      header: "Unit",
      sortable: false,
      render: (a) => lookups.unitCode(bookingOf(a.bookingId)?.unitId),
    },
    {
      key: "agreementDate",
      header: "Agreement Date",
      value: (a) => a.agreementDate,
      render: (a) => formatDate(a.agreementDate),
    },
    {
      key: "agreementValue",
      header: "Agreement Value",
      value: (a) => a.agreementValue,
      render: (a) => formatINR(a.agreementValue, { compact: true }),
    },
    { key: "status", header: "Status", render: (a) => <StatusBadge value={a.status} /> },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Agreement actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {STATUSES.filter((s) => s !== a.status).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => changeStatus.mutate({ id: a.id, status: s })}
                  >
                    {titleize(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {a.status === "DRAFT" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => setDeleting(a)}
                >
                  Delete draft
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<Agreement>[] = [
    { key: "status", label: "Status", options: STATUSES, match: (a, v) => a.status === v },
  ];

  return (
    <div>
      <PageHeader
        title="Agreements"
        description="Sale agreements generated for confirmed bookings."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New Agreement
          </Button>
        }
      />
      <DataTable
        rows={agreements ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["code", "notes"]}
        filters={filters}
        exportName="agreements"
        emptyTitle="No agreements yet"
        emptyDescription="Agreements appear here once generated for a booking."
      />

      <AgreementFormDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete draft agreement?"
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
