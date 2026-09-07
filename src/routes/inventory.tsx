import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UnitFormDialog } from "@/components/projects/UnitFormDialog";
import { UnitHoldDialog } from "@/components/projects/UnitHoldDialog";
import { UnitBlockDialog } from "@/components/projects/UnitBlockDialog";
import { UnitDetailSheet } from "@/components/projects/UnitDetailSheet";
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
import { unitService } from "@/services";
import { formatINR } from "@/lib/format";
import type { Unit, UnitStatus } from "@/types";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

const UNIT_STATUSES: UnitStatus[] = ["AVAILABLE", "HOLD", "BOOKED", "SOLD", "BLOCKED"];

function InventoryPage() {
  const lookups = useLookups();
  const { data: units, isLoading } = useData(["units", "all"], unitService.all);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [holding, setHolding] = useState<Unit | null>(null);
  const [blocking, setBlocking] = useState<Unit | null>(null);
  const [viewing, setViewing] = useState<Unit | null>(null);

  const remove = useAction(unitService.remove, { success: "Unit deleted" });
  const release = useAction(unitService.release, { success: "Hold released" });

  const columns: Column<Unit>[] = [
    { key: "code", header: "Unit" },
    {
      key: "projectId",
      header: "Project",
      value: (u) => lookups.projectName(u.projectId),
      render: (u) => lookups.projectName(u.projectId),
    },
    {
      key: "towerId",
      header: "Tower",
      value: (u) => lookups.towerName(u.towerId),
      render: (u) => lookups.towerName(u.towerId),
    },
    { key: "floor", header: "Floor" },
    { key: "bhk", header: "BHK" },
    { key: "carpetArea", header: "Area (sq.ft)" },
    {
      key: "total",
      header: "Price",
      value: (u) => unitService.total(u),
      render: (u) => formatINR(unitService.total(u), { compact: true }),
    },
    { key: "status", header: "Status", render: (u) => <StatusBadge value={u.status} /> },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              aria-label="Unit actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => setViewing(u)}>View</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditing(u)}>Edit</DropdownMenuItem>
            {u.status === "AVAILABLE" && (
              <DropdownMenuItem onClick={() => setHolding(u)}>Hold Unit</DropdownMenuItem>
            )}
            {u.status === "HOLD" && (
              <DropdownMenuItem onClick={() => release.mutate(u.id)}>Release Hold</DropdownMenuItem>
            )}
            {(u.status === "AVAILABLE" || u.status === "BLOCKED") && (
              <DropdownMenuItem onClick={() => setBlocking(u)}>
                {u.status === "BLOCKED" ? "Unblock" : "Block"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleting(u)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<Unit>[] = [
    {
      key: "projectId",
      label: "Project",
      options: lookups.projects.map((p) => p.id),
      match: (u, v) => u.projectId === v,
      optionLabel: (id) => lookups.projectName(id),
    },
    {
      key: "towerId",
      label: "Tower",
      options: lookups.towers.map((t) => t.id),
      match: (u, v) => u.towerId === v,
      optionLabel: (id) => lookups.towerName(id),
    },
    { key: "status", label: "Status", options: UNIT_STATUSES, match: (u, v) => u.status === v },
    {
      key: "bhk",
      label: "BHK",
      options: [...new Set((units ?? []).map((u) => String(u.bhk)))].sort(),
      match: (u, v) => String(u.bhk) === v,
      optionLabel: (v) => `${v} BHK`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Unit Inventory"
        description="Every unit across every project, with live availability."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add Unit
          </Button>
        }
      />
      <DataTable
        rows={units ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["code", "facing"]}
        filters={filters}
        onRowClick={(u) => setViewing(u)}
        pageSize={12}
        exportName="units"
        emptyTitle="No units found"
        emptyDescription="Add towers to a project, then add units here."
      />

      <UnitFormDialog open={creating} onOpenChange={setCreating} />
      <UnitFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        unit={editing ?? undefined}
      />
      <UnitHoldDialog
        open={Boolean(holding)}
        onOpenChange={(v) => !v && setHolding(null)}
        unit={holding ?? undefined}
      />
      <UnitBlockDialog
        open={Boolean(blocking)}
        onOpenChange={(v) => !v && setBlocking(null)}
        unit={blocking ?? undefined}
      />
      <UnitDetailSheet
        unit={viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        onEdit={(u) => {
          setViewing(null);
          setEditing(u);
        }}
        onHold={(u) => {
          setViewing(null);
          setHolding(u);
        }}
        onBlock={(u) => {
          setViewing(null);
          setBlocking(u);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete unit?"
        description={`This will permanently remove ${deleting?.code ?? "this unit"}. This action cannot be undone.`}
        confirmLabel="Delete Unit"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
