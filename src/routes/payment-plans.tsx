import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/DetailCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PaymentPlanFormDialog } from "@/components/sales/PaymentPlanFormDialog";
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
import { paymentPlanService } from "@/services";
import type { PaymentPlan } from "@/types";

export const Route = createFileRoute("/payment-plans")({
  component: PaymentPlansPage,
});

function PaymentPlansPage() {
  const lookups = useLookups();
  const { data: plans, isLoading } = useData(["paymentPlans", "all"], paymentPlanService.all);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PaymentPlan | null>(null);
  const [deleting, setDeleting] = useState<PaymentPlan | null>(null);

  const remove = useAction(paymentPlanService.remove, { success: "Payment plan deleted" });

  return (
    <div>
      <PageHeader
        title="Payment Plans"
        description="Configurable milestone-based payment schedules for bookings."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New Plan
          </Button>
        }
      />

      {isLoading ? (
        <EmptyState title="Loading…" />
      ) : plans?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <Panel
              key={p.id}
              title={p.name}
              description={p.projectId ? lookups.projectName(p.projectId) : "All Projects"}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Plan actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(p)}>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={() => setDeleting(p)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            >
              <ul className="space-y-2">
                {p.milestones.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{m.name}</span>
                    <span className="font-medium text-muted-foreground">{m.percentage}%</span>
                  </li>
                ))}
              </ul>
              {p.description && (
                <p className="mt-3 text-xs text-muted-foreground">{p.description}</p>
              )}
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No payment plans yet"
          description="Create a payment plan to attach to bookings."
        />
      )}

      <PaymentPlanFormDialog open={creating} onOpenChange={setCreating} />
      <PaymentPlanFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        plan={editing ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete payment plan?"
        description={`This will permanently remove "${deleting?.name ?? "this plan"}". This action cannot be undone.`}
        confirmLabel="Delete Plan"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
