import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel, FieldList } from "@/components/shared/DetailCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { EmptyState } from "@/components/shared/EmptyState";
import { KpiCard } from "@/components/shared/KpiCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CustomerFormDialog } from "@/components/crm/CustomerFormDialog";
import { QuickContactLinks } from "@/components/crm/QuickContactLinks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { activityService, bookingService, customerService } from "@/services";
import { formatDate, formatDateTime, formatINR, titleize } from "@/lib/format";

export const Route = createFileRoute("/customers/$id")({
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const lookups = useLookups();

  const {
    data: customer,
    isLoading,
    isError,
  } = useData(["customers", id], () => customerService.getById(id));
  const { data: bookings } = useData(["bookings", "all"], bookingService.all);
  const { data: activities } = useData(["activities", id], () => activityService.forEntity(id));

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = useAction(customerService.remove, {
    success: "Customer deleted",
    onDone: () => navigate({ to: "/customers" }),
  });

  if (isError) {
    return (
      <EmptyState
        title="Customer not found"
        description="This customer may have been deleted, or the link is incorrect."
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/customers" })}>
            Back to Customers
          </Button>
        }
      />
    );
  }

  if (isLoading || !customer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const customerBookings = (bookings ?? []).filter((b) => b.customerId === id);
  const finance = customerService.finance(id);
  const ledger = customerService.ledger(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(true)}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </>
        }
      >
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{customer.code}</span>
          <span>{customer.city || "—"}</span>
        </div>
        <div className="mt-3">
          <QuickContactLinks phone={customer.phone} email={customer.email} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({customerBookings.length})</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Agreement Value"
              value={formatINR(finance.agreementValue, { compact: true })}
            />
            <KpiCard
              label="Paid"
              value={formatINR(finance.paid, { compact: true })}
              accent="success"
            />
            <KpiCard
              label="Due"
              value={formatINR(finance.due, { compact: true })}
              accent="warning"
            />
            <KpiCard
              label="Overdue"
              value={formatINR(finance.overdue, { compact: true })}
              accent="danger"
            />
          </div>
          <Panel title="Profile">
            <FieldList
              items={[
                { label: "Phone", value: customer.phone },
                { label: "Email", value: customer.email },
                { label: "PAN", value: customer.pan || "—" },
                { label: "Address", value: customer.address || "—" },
                { label: "City", value: customer.city || "—" },
                { label: "Source", value: titleize(customer.source) },
                { label: "Assigned Salesperson", value: lookups.userName(customer.assignedToId) },
                { label: "Customer Since", value: formatDate(customer.createdAt) },
              ]}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="bookings">
          <Panel>
            {customerBookings.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {[
                        "Booking",
                        "Project",
                        "Unit",
                        "Status",
                        "Agreement Value",
                        "Booking Date",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customerBookings.map((b) => (
                      <tr key={b.id} className="border-t border-border">
                        <td className="px-4 py-3">{b.code}</td>
                        <td className="px-4 py-3">{lookups.projectName(b.projectId)}</td>
                        <td className="px-4 py-3">{lookups.unitCode(b.unitId)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge value={b.status} />
                        </td>
                        <td className="px-4 py-3">
                          {formatINR(b.agreementValue, { compact: true })}
                        </td>
                        <td className="px-4 py-3">{formatDate(b.bookingDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No bookings yet"
                description="Bookings made by this customer will appear here."
              />
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="ledger">
          <Panel description="Running balance across every demand and payment.">
            {ledger.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Date", "Description", "Debit", "Credit", "Balance"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="px-4 py-3">{formatDate(row.date)}</td>
                        <td className="px-4 py-3">{row.description}</td>
                        <td className="px-4 py-3">
                          {row.debit ? formatINR(row.debit, { compact: true }) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.credit ? formatINR(row.credit, { compact: true }) : "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {formatINR(row.balance, { compact: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No ledger entries yet"
                description="Demands and payments will build this customer's ledger."
              />
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="activity">
          <Panel title="Activity">
            <ActivityTimeline items={activities ?? []} />
          </Panel>
        </TabsContent>
      </Tabs>

      <CustomerFormDialog open={editing} onOpenChange={setEditing} customer={customer} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete customer?"
        description={`This will permanently remove ${customer.name}. This action cannot be undone.`}
        confirmLabel="Delete Customer"
        destructive
        onConfirm={() => remove.mutate(customer.id)}
      />
    </div>
  );
}
