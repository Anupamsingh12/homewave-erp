import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { leadService } from "@/services";
import { formatDate, formatINR, titleize } from "@/lib/format";
import type { Lead, LeadStatus } from "@/types";

export const Route = createFileRoute("/leads/kanban")({
  component: LeadsKanbanPage,
});

const COLUMNS: { status: LeadStatus; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "CONTACTED", label: "Contacted" },
  { status: "SITE_VISIT", label: "Site Visit" },
  { status: "QUALIFIED", label: "Qualified" },
  { status: "NEGOTIATION", label: "Negotiation" },
  { status: "CONVERTED", label: "Won" },
  { status: "LOST", label: "Lost" },
];

function LeadsKanbanPage() {
  const navigate = useNavigate();
  const lookups = useLookups();
  const { data: leads, isLoading } = useData(["leads", "all"], leadService.all);
  const changeStatus = useAction(
    (input: { id: string; status: LeadStatus }) => leadService.changeStatus(input.id, input.status),
    { success: "Lead status updated" },
  );

  return (
    <div>
      <PageHeader
        title="Sales Pipeline"
        description="Drag leads forward by changing their stage."
      />
      {isLoading ? (
        <EmptyState title="Loading pipeline…" />
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {COLUMNS.map((col) => {
            const items = (leads ?? []).filter((l) => l.status === col.status);
            return (
              <div
                key={col.status}
                className="min-w-0 rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onOpen={() => navigate({ to: "/leads/$id", params: { id: lead.id } })}
                      onChangeStatus={(status) => changeStatus.mutate({ id: lead.id, status })}
                      projectName={lookups.projectName(lead.projectId)}
                    />
                  ))}
                  {!items.length && (
                    <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                      No leads
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onOpen,
  onChangeStatus,
  projectName,
}: {
  lead: Lead;
  onOpen: () => void;
  onChangeStatus: (status: LeadStatus) => void;
  projectName: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-card">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <p className="text-sm font-medium text-foreground">{lead.name}</p>
        <p className="text-xs text-muted-foreground">{projectName}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {formatINR(lead.budget, { compact: true })}
        </p>
        {lead.nextFollowUpAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Follow-up: {formatDate(lead.nextFollowUpAt)}
          </p>
        )}
      </button>
      <Select value={lead.status} onValueChange={(v) => onChangeStatus(v as LeadStatus)}>
        <SelectTrigger className="mt-2 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COLUMNS.map((c) => (
            <SelectItem key={c.status} value={c.status}>
              {titleize(c.status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
