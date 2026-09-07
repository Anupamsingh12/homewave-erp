import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, Pencil, Trash2, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel, FieldList } from "@/components/shared/DetailCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { FollowUpFormDialog } from "@/components/crm/FollowUpFormDialog";
import { SiteVisitFormDialog } from "@/components/crm/SiteVisitFormDialog";
import { QuickContactLinks } from "@/components/crm/QuickContactLinks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { activityService, followUpService, leadService, siteVisitService } from "@/services";
import { formatDateTime, formatINR, titleize } from "@/lib/format";

export const Route = createFileRoute("/leads/$id")({
  component: LeadDetailPage,
});

function LeadDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const lookups = useLookups();

  const { data: lead, isLoading, isError } = useData(["leads", id], () => leadService.getById(id));
  const { data: followUps } = useData(["followUps", "all"], followUpService.all);
  const { data: siteVisits } = useData(["siteVisits", "all"], siteVisitService.all);
  const { data: activities } = useData(["activities", id], () => activityService.forEntity(id));

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [schedulingVisit, setSchedulingVisit] = useState(false);

  const remove = useAction(leadService.remove, {
    success: "Lead deleted",
    onDone: () => navigate({ to: "/leads" }),
  });
  const convert = useAction(leadService.convert, {
    success: "Lead converted to customer",
    onDone: (customer) => navigate({ to: "/customers/$id", params: { id: customer.id } }),
  });
  const completeFollowUp = useAction(
    (fid: string) => followUpService.update(fid, { status: "COMPLETED" }),
    { success: "Follow-up marked complete" },
  );

  if (isError) {
    return (
      <EmptyState
        title="Lead not found"
        description="This lead may have been deleted, or the link is incorrect."
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/leads" })}>
            Back to Leads
          </Button>
        }
      />
    );
  }

  if (isLoading || !lead) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const leadFollowUps = (followUps ?? []).filter((f) => f.leadId === id);
  const leadVisits = (siteVisits ?? []).filter((v) => v.leadId === id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.name}
        actions={
          <>
            <Button variant="outline" onClick={() => setSchedulingVisit(true)}>
              <CalendarClock className="size-4" /> Schedule Visit
            </Button>
            <Button variant="outline" onClick={() => setSchedulingFollowUp(true)}>
              <ClipboardList className="size-4" /> Add Follow-up
            </Button>
            {lead.status !== "CONVERTED" && (
              <Button variant="outline" onClick={() => convert.mutate(lead.id)}>
                <UserCheck className="size-4" /> Convert
              </Button>
            )}
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
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StatusBadge value={lead.status} />
          <span className="text-sm font-medium text-muted-foreground">
            {formatINR(lead.budget, { compact: true })} Budget
          </span>
        </div>
        <div className="mt-3">
          <QuickContactLinks phone={lead.phone} email={lead.email} />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Contact Information">
            <FieldList
              items={[
                { label: "Phone", value: lead.phone },
                { label: "Email", value: lead.email },
              ]}
            />
          </Panel>

          <Panel title="Lead Information">
            <FieldList
              items={[
                { label: "Source", value: titleize(lead.source) },
                { label: "Interested Project", value: lookups.projectName(lead.projectId) },
                { label: "Assigned To", value: lookups.userName(lead.assignedToId) },
                { label: "Channel Partner", value: lookups.partnerName(lead.channelPartnerId) },
                { label: "Requirement", value: lead.requirement || "—" },
                { label: "Notes", value: lead.notes || "—" },
                { label: "Created", value: formatDateTime(lead.createdAt) },
              ]}
            />
          </Panel>

          <Panel
            title="Follow-ups"
            actions={
              <Button variant="ghost" size="sm" onClick={() => setSchedulingFollowUp(true)}>
                Add
              </Button>
            }
          >
            {leadFollowUps.length ? (
              <ul className="space-y-3">
                {leadFollowUps.map((f) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{f.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDateTime(f.dueAt)} · {lookups.userName(f.assignedToId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={f.priority} />
                      <StatusBadge value={f.status} />
                      {f.status === "OPEN" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => completeFollowUp.mutate(f.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No follow-ups yet"
                description="Schedule a follow-up to keep this lead moving."
              />
            )}
          </Panel>

          <Panel
            title="Site Visits"
            actions={
              <Button variant="ghost" size="sm" onClick={() => setSchedulingVisit(true)}>
                Schedule
              </Button>
            }
          >
            {leadVisits.length ? (
              <ul className="space-y-3">
                {leadVisits.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {lookups.projectName(v.projectId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(v.visitAt)} · {v.visitors} visitor(s)
                      </p>
                    </div>
                    <StatusBadge value={v.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No site visits yet"
                description="Schedule a visit when this lead is ready to see a project."
              />
            )}
          </Panel>
        </div>

        <div>
          <Panel title="Activity">
            <ActivityTimeline items={activities ?? []} />
          </Panel>
        </div>
      </div>

      <LeadFormDialog open={editing} onOpenChange={setEditing} lead={lead} />
      <FollowUpFormDialog
        open={schedulingFollowUp}
        onOpenChange={setSchedulingFollowUp}
        leadId={lead.id}
      />
      <SiteVisitFormDialog
        open={schedulingVisit}
        onOpenChange={setSchedulingVisit}
        leadId={lead.id}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete lead?"
        description={`This will permanently remove ${lead.name}. This action cannot be undone.`}
        confirmLabel="Delete Lead"
        destructive
        onConfirm={() => remove.mutate(lead.id)}
      />
    </div>
  );
}
