import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/DetailCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { KpiCard } from "@/components/shared/KpiCard";
import { MilestoneFormDialog } from "@/components/operations/MilestoneFormDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { constructionService } from "@/services";
import { formatDate } from "@/lib/format";
import type { ConstructionMilestone } from "@/types";

export const Route = createFileRoute("/construction")({
  component: ConstructionPage,
});

function ConstructionPage() {
  const lookups = useLookups();
  const { data: milestones, isLoading } = useData(
    ["constructionMilestones", "all"],
    constructionService.all,
  );

  const [projectId, setProjectId] = useState<string>("ALL");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ConstructionMilestone | null>(null);
  const [deleting, setDeleting] = useState<ConstructionMilestone | null>(null);

  const remove = useAction(constructionService.remove, { success: "Milestone deleted" });

  const filtered = useMemo(() => {
    const rows = milestones ?? [];
    return (projectId === "ALL" ? rows : rows.filter((m) => m.projectId === projectId)).sort(
      (a, b) => a.sequence - b.sequence,
    );
  }, [milestones, projectId]);

  const overallProgress = filtered.length
    ? Math.round(filtered.reduce((s, m) => s + m.progress, 0) / filtered.length)
    : 0;
  const current = filtered.find((m) => m.status === "IN_PROGRESS" || m.status === "DELAYED");
  const delayedCount = filtered.filter((m) => m.status === "DELAYED").length;
  const upcomingCount = filtered.filter((m) => m.status === "NOT_STARTED").length;

  return (
    <div>
      <PageHeader
        title="Construction"
        description="Track milestone progress across every project."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add Milestone
          </Button>
        }
      >
        <div className="mt-3 max-w-xs">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              {lookups.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Overall Progress" value={`${overallProgress}%`} />
        <KpiCard label="Current Milestone" value={current?.name ?? "—"} accent="info" />
        <KpiCard label="Delayed Milestones" value={String(delayedCount)} accent="danger" />
        <KpiCard label="Upcoming Milestones" value={String(upcomingCount)} accent="warning" />
      </div>

      <Panel title="Milestone Timeline">
        {isLoading ? (
          <EmptyState title="Loading…" />
        ) : filtered.length ? (
          <ul className="space-y-4">
            {filtered.map((m) => (
              <li key={m.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {m.name}
                      {projectId === "ALL" && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {lookups.projectName(m.projectId)}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Start {formatDate(m.startDate)} · Expected {formatDate(m.expectedDate)}
                      {m.actualDate && ` · Actual ${formatDate(m.actualDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={m.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Milestone actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(m)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => setDeleting(m)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={m.progress} className="h-2" />
                  <span className="w-10 shrink-0 text-xs text-muted-foreground">{m.progress}%</span>
                </div>
                {m.notes && <p className="mt-2 text-xs text-muted-foreground">{m.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No milestones yet"
            description="Add construction milestones to track progress for this project."
          />
        )}
      </Panel>

      <MilestoneFormDialog open={creating} onOpenChange={setCreating} />
      <MilestoneFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        milestone={editing ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete milestone?"
        description="This action cannot be undone."
        confirmLabel="Delete Milestone"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
