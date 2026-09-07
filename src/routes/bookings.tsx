import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BookingFormDialog } from "@/components/sales/BookingFormDialog";
import { BookingDetailSheet } from "@/components/sales/BookingDetailSheet";
import { Button } from "@/components/ui/button";
import { useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { bookingService } from "@/services";
import { formatDate, formatINR } from "@/lib/format";
import type { Booking, BookingStatus } from "@/types";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

const BOOKING_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

function BookingsPage() {
  const lookups = useLookups();
  const { data: bookings, isLoading } = useData(["bookings", "all"], bookingService.all);

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Booking | null>(null);

  const columns: Column<Booking>[] = [
    { key: "code", header: "Booking ID" },
    {
      key: "customerId",
      header: "Customer",
      value: (b) => lookups.customerName(b.customerId),
      render: (b) => lookups.customerName(b.customerId),
    },
    {
      key: "projectId",
      header: "Project",
      value: (b) => lookups.projectName(b.projectId),
      render: (b) => lookups.projectName(b.projectId),
    },
    {
      key: "unitId",
      header: "Unit",
      value: (b) => lookups.unitCode(b.unitId),
      render: (b) => lookups.unitCode(b.unitId),
    },
    {
      key: "bookingDate",
      header: "Booking Date",
      value: (b) => b.bookingDate,
      render: (b) => formatDate(b.bookingDate),
    },
    {
      key: "agreementValue",
      header: "Agreement Value",
      value: (b) => b.agreementValue,
      render: (b) => formatINR(b.agreementValue, { compact: true }),
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      sortable: false,
      render: (b) => <StatusBadge value={bookingService.paymentStatus(b.id)} tone="info" />,
    },
    { key: "status", header: "Booking Status", render: (b) => <StatusBadge value={b.status} /> },
    {
      key: "salespersonId",
      header: "Salesperson",
      value: (b) => lookups.userName(b.salespersonId),
      render: (b) => lookups.userName(b.salespersonId),
    },
  ];

  const filters: FilterDef<Booking>[] = [
    {
      key: "projectId",
      label: "Project",
      options: lookups.projects.map((p) => p.id),
      match: (b, v) => b.projectId === v,
      optionLabel: (id) => lookups.projectName(id),
    },
    { key: "status", label: "Status", options: BOOKING_STATUSES, match: (b, v) => b.status === v },
    {
      key: "salespersonId",
      label: "Salesperson",
      options: lookups.users.map((u) => u.id),
      match: (b, v) => b.salespersonId === v,
      optionLabel: (id) => lookups.userName(id),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Every unit booking, from confirmation through to possession."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New Booking
          </Button>
        }
      />
      <DataTable
        rows={bookings ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["code", "notes"]}
        filters={filters}
        onRowClick={(b) => setViewing(b)}
        exportName="bookings"
        emptyTitle="No bookings yet"
        emptyDescription="Book an available unit to see it appear here."
      />

      <BookingFormDialog open={creating} onOpenChange={setCreating} />
      <BookingDetailSheet booking={viewing} onOpenChange={(v) => !v && setViewing(null)} />
    </div>
  );
}
