import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { bookingService, commissionService } from "@/services";
import { formatINR, titleize } from "@/lib/format";
import type { Commission, CommissionStatus } from "@/types";

export const Route = createFileRoute("/commissions")({
  component: CommissionsPage,
});

const STATUSES: CommissionStatus[] = ["PENDING", "ELIGIBLE", "APPROVED", "PAID", "CANCELLED"];

function CommissionsPage() {
  const lookups = useLookups();
  const { data: commissions, isLoading } = useData(["commissions", "all"], commissionService.all);
  const { data: bookings } = useData(["bookings", "all"], bookingService.all);

  const changeStatus = useAction(
    (input: { id: string; status: CommissionStatus }) =>
      commissionService.update(input.id, { status: input.status }),
    { success: "Commission status updated" },
  );
  const markPaid = useAction(
    (input: { id: string; amount: number }) =>
      commissionService.update(input.id, { status: "PAID", paidAmount: input.amount }),
    { success: "Commission marked as paid" },
  );

  const bookingOf = (bookingId: string) => (bookings ?? []).find((b) => b.id === bookingId);

  const columns: Column<Commission>[] = [
    { key: "code", header: "Commission" },
    {
      key: "channelPartnerId",
      header: "Channel Partner",
      value: (c) => lookups.partnerName(c.channelPartnerId),
      render: (c) => lookups.partnerName(c.channelPartnerId),
    },
    {
      key: "bookingId",
      header: "Booking",
      value: (c) => bookingOf(c.bookingId)?.code ?? "",
      render: (c) => bookingOf(c.bookingId)?.code ?? "—",
    },
    { key: "percentage", header: "Commission %", render: (c) => `${c.percentage}%` },
    {
      key: "amount",
      header: "Commission Amount",
      value: (c) => c.amount,
      render: (c) => formatINR(c.amount, { compact: true }),
    },
    {
      key: "paidAmount",
      header: "Paid",
      value: (c) => c.paidAmount,
      render: (c) => formatINR(c.paidAmount, { compact: true }),
    },
    { key: "status", header: "Payout Status", render: (c) => <StatusBadge value={c.status} /> },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Commission actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {c.status !== "PAID" && c.status !== "CANCELLED" && (
              <DropdownMenuItem onClick={() => markPaid.mutate({ id: c.id, amount: c.amount })}>
                Mark Paid
              </DropdownMenuItem>
            )}
            {STATUSES.filter((s) => s !== c.status && s !== "PAID").map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => changeStatus.mutate({ id: c.id, status: s })}
              >
                Mark {titleize(s)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<Commission>[] = [
    { key: "status", label: "Status", options: STATUSES, match: (c, v) => c.status === v },
    {
      key: "channelPartnerId",
      label: "Partner",
      options: lookups.partners.map((p) => p.id),
      match: (c, v) => c.channelPartnerId === v,
      optionLabel: (id) => lookups.partnerName(id),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Commissions"
        description="Channel partner commission accrual and payouts."
      />
      <DataTable
        rows={commissions ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["code"]}
        filters={filters}
        exportName="commissions"
        emptyTitle="No commissions yet"
        emptyDescription="Commissions accrue automatically when a channel-partner booking is created."
      />
    </div>
  );
}
