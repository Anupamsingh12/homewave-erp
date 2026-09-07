import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ChannelPartnerFormDialog } from "@/components/partners/ChannelPartnerFormDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { channelPartnerService } from "@/services";
import type { ChannelPartner } from "@/types";

export const Route = createFileRoute("/partners/")({
  component: PartnersPage,
});

function PartnersPage() {
  const navigate = useNavigate();
  const { data: partners, isLoading } = useData(
    ["channelPartners", "all"],
    channelPartnerService.all,
  );

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ChannelPartner | null>(null);

  const toggleActive = useAction(
    (input: { id: string; active: boolean }) =>
      channelPartnerService.update(input.id, { active: input.active }),
    { success: "Channel partner updated" },
  );

  const columns: Column<ChannelPartner>[] = [
    { key: "company", header: "Company" },
    { key: "contactPerson", header: "Contact Person" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "reraNumber", header: "RERA Number" },
    { key: "commissionPct", header: "Commission %", render: (p) => `${p.commissionPct}%` },
    {
      key: "active",
      header: "Status",
      render: (p) => <StatusBadge value={p.active ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              aria-label="Partner actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={() => navigate({ to: "/partners/$id", params: { id: p.id } })}
            >
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditing(p)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleActive.mutate({ id: p.id, active: !p.active })}>
              {p.active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<ChannelPartner>[] = [
    {
      key: "active",
      label: "Status",
      options: ["ACTIVE", "INACTIVE"],
      match: (p, v) => (v === "ACTIVE") === p.active,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Channel Partners"
        description="Brokers and agencies feeding leads and bookings into the pipeline."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add Partner
          </Button>
        }
      />
      <DataTable
        rows={partners ?? []}
        columns={columns}
        loading={isLoading}
        searchFields={["company", "contactPerson", "phone", "email", "code", "city"]}
        filters={filters}
        onRowClick={(p) => navigate({ to: "/partners/$id", params: { id: p.id } })}
        exportName="channel-partners"
        emptyTitle="No channel partners yet"
        emptyDescription="Add a broker or agency to start tracking referred leads and bookings."
      />

      <ChannelPartnerFormDialog open={creating} onOpenChange={setCreating} />
      <ChannelPartnerFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        partner={editing ?? undefined}
      />
    </div>
  );
}
