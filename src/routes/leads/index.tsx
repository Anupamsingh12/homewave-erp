import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { FollowUpFormDialog } from "@/components/crm/FollowUpFormDialog";
import { SiteVisitFormDialog } from "@/components/crm/SiteVisitFormDialog";
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
import { leadService } from "@/services";
import { formatDate, formatINR, titleize } from "@/lib/format";
import type { Lead, LeadStatus } from "@/types";

export const Route = createFileRoute("/leads/")({
  component: LeadsPage,
});

const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "SITE_VISIT",
  "QUALIFIED",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
];

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

function LeadsPage() {
  const navigate = useNavigate();
  const lookups = useLookups();
  const { data: leads, isLoading } = useData(["leads", "all"], leadService.all);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [schedulingFollowUp, setSchedulingFollowUp] = useState<Lead | null>(null);
  const [schedulingVisit, setSchedulingVisit] = useState<Lead | null>(null);

  const remove = useAction(leadService.remove, { success: "Lead deleted" });
  const changeStatus = useAction(
    (input: { id: string; status: LeadStatus }) => leadService.changeStatus(input.id, input.status),
    { success: "Lead status updated" },
  );
  const convert = useAction(leadService.convert, {
    success: "Lead converted to customer",
    onDone: (customer) => navigate({ to: "/customers/$id", params: { id: customer.id } }),
  });

  const columns: Column<Lead>[] = [
    { key: "code", header: "Lead ID" },
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "source", header: "Source", render: (l) => titleize(l.source) },
    {
      key: "projectId",
      header: "Interested Project",
      value: (l) => lookups.projectName(l.projectId),
      render: (l) => lookups.projectName(l.projectId),
    },
    {
      key: "budget",
      header: "Budget",
      value: (l) => l.budget,
      render: (l) => formatINR(l.budget, { compact: true }),
    },
    { key: "status", header: "Status", render: (l) => <StatusBadge value={l.status} /> },
    {
      key: "assignedToId",
      header: "Assigned To",
      value: (l) => lookups.userName(l.assignedToId),
      render: (l) => lookups.userName(l.assignedToId),
    },
    {
      key: "nextFollowUpAt",
      header: "Next Follow-up",
      value: (l) => l.nextFollowUpAt ?? "",
      render: (l) => formatDate(l.nextFollowUpAt),
    },
    {
      key: "createdAt",
      header: "Created",
      value: (l) => l.createdAt,
      render: (l) => formatDate(l.createdAt),
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (l) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              aria-label="Lead actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => navigate({ to: "/leads/$id", params: { id: l.id } })}>
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditing(l)}>Edit</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {LEAD_STATUSES.filter((s) => s !== l.status).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => changeStatus.mutate({ id: l.id, status: s })}
                  >
                    {titleize(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => setSchedulingFollowUp(l)}>
              Schedule follow-up
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSchedulingVisit(l)}>
              Schedule site visit
            </DropdownMenuItem>
            {l.status !== "CONVERTED" && (
              <DropdownMenuItem onClick={() => convert.mutate(l.id)}>
                Convert to customer
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleting(l)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<Lead>[] = [
    {
      key: "status",
      label: "Status",
      options: LEAD_STATUSES,
      match: (l, v) => l.status === v,
    },
    {
      key: "source",
      label: "Source",
      options: LEAD_SOURCES,
      match: (l, v) => l.source === v,
    },
    {
      key: "projectId",
      label: "Project",
      options: lookups.projects.map((p) => p.id),
      match: (l, v) => l.projectId === v,
      optionLabel: (id) => lookups.projectName(id),
    },
    {
      key: "assignedToId",
      label: "Assigned To",
      options: lookups.users.map((u) => u.id),
      match: (l, v) => l.assignedToId === v,
      optionLabel: (id) => lookups.userName(id),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Track and manage your sales pipeline from first contact to conversion."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add Lead
          </Button>
        }
      />
      <DataTable
        rows={leads ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["name", "phone", "email", "code"]}
        filters={filters}
        onRowClick={(l) => navigate({ to: "/leads/$id", params: { id: l.id } })}
        exportName="leads"
        emptyTitle="No leads found"
        emptyDescription="Start building your sales pipeline by adding your first lead."
      />

      <LeadFormDialog open={creating} onOpenChange={setCreating} />
      <LeadFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        lead={editing ?? undefined}
      />
      <FollowUpFormDialog
        open={Boolean(schedulingFollowUp)}
        onOpenChange={(v) => !v && setSchedulingFollowUp(null)}
        leadId={schedulingFollowUp?.id}
      />
      <SiteVisitFormDialog
        open={Boolean(schedulingVisit)}
        onOpenChange={(v) => !v && setSchedulingVisit(null)}
        leadId={schedulingVisit?.id}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete lead?"
        description={`This will permanently remove ${deleting?.name ?? "this lead"}. This action cannot be undone.`}
        confirmLabel="Delete Lead"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
