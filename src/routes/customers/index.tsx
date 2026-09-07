import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CustomerFormDialog } from "@/components/crm/CustomerFormDialog";
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
import { customerService } from "@/services";
import { formatINR, titleize } from "@/lib/format";
import type { Customer } from "@/types";

export const Route = createFileRoute("/customers/")({
  component: CustomersPage,
});

const LEAD_SOURCES = [
  "WEBSITE",
  "WALK_IN",
  "REFERRAL",
  "CHANNEL_PARTNER",
  "FACEBOOK",
  "GOOGLE_ADS",
  "PROPERTY_PORTAL",
  "EXHIBITION",
];

function CustomersPage() {
  const navigate = useNavigate();
  const lookups = useLookups();
  const { data: customers, isLoading } = useData(["customers", "all"], customerService.all);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const remove = useAction(customerService.remove, { success: "Customer deleted" });

  const columns: Column<Customer>[] = [
    { key: "code", header: "Customer ID" },
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "pan", header: "PAN" },
    { key: "city", header: "City" },
    { key: "source", header: "Source", render: (c) => titleize(c.source) },
    {
      key: "assignedToId",
      header: "Salesperson",
      value: (c) => lookups.userName(c.assignedToId),
      render: (c) => lookups.userName(c.assignedToId),
    },
    {
      key: "bookingValue",
      header: "Booking Value",
      value: (c) => customerService.finance(c.id).agreementValue,
      render: (c) => formatINR(customerService.finance(c.id).agreementValue, { compact: true }),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      value: (c) => customerService.finance(c.id).due,
      render: (c) => formatINR(customerService.finance(c.id).due, { compact: true }),
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              aria-label="Customer actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={() => navigate({ to: "/customers/$id", params: { id: c.id } })}
            >
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditing(c)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleting(c)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<Customer>[] = [
    { key: "source", label: "Source", options: LEAD_SOURCES, match: (c, v) => c.source === v },
    {
      key: "assignedToId",
      label: "Salesperson",
      options: lookups.users.map((u) => u.id),
      match: (c, v) => c.assignedToId === v,
      optionLabel: (id) => lookups.userName(id),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Every buyer, their bookings, and their outstanding balance in one place."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add Customer
          </Button>
        }
      />
      <DataTable
        rows={customers ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["name", "phone", "email", "code", "city"]}
        filters={filters}
        onRowClick={(c) => navigate({ to: "/customers/$id", params: { id: c.id } })}
        exportName="customers"
        emptyTitle="No customers found"
        emptyDescription="Customers appear here once a lead converts or you add one directly."
      />

      <CustomerFormDialog open={creating} onOpenChange={setCreating} />
      <CustomerFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        customer={editing ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete customer?"
        description={`This will permanently remove ${deleting?.name ?? "this customer"}. This action cannot be undone.`}
        confirmLabel="Delete Customer"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
