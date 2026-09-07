import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { endOfDay, startOfDay } from "date-fns";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FollowUpFormDialog } from "@/components/crm/FollowUpFormDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { followUpService } from "@/services";
import { formatDateTime } from "@/lib/format";
import type { FollowUp, Priority } from "@/types";

export const Route = createFileRoute("/follow-ups")({
  component: FollowUpsPage,
});

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

function FollowUpsPage() {
  const lookups = useLookups();
  const { data: followUps, isLoading } = useData(["followUps", "all"], followUpService.all);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [deleting, setDeleting] = useState<FollowUp | null>(null);

  const remove = useAction(followUpService.remove, { success: "Follow-up deleted" });
  const complete = useAction((id: string) => followUpService.update(id, { status: "COMPLETED" }), {
    success: "Follow-up marked complete",
  });

  const buckets = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const rows = followUps ?? [];
    return {
      today: rows.filter((f) => {
        const t = new Date(f.dueAt).getTime();
        return f.status === "OPEN" && t >= todayStart && t <= todayEnd;
      }),
      upcoming: rows.filter((f) => f.status === "OPEN" && new Date(f.dueAt).getTime() > todayEnd),
      overdue: rows.filter((f) => f.status === "OPEN" && new Date(f.dueAt).getTime() < todayStart),
      completed: rows.filter((f) => f.status !== "OPEN"),
    };
  }, [followUps]);

  const columns: Column<FollowUp>[] = [
    { key: "related", header: "Customer / Lead", render: (f) => lookups.relatedName(f) },
    { key: "title", header: "Task" },
    {
      key: "dueAt",
      header: "Due Date",
      value: (f) => f.dueAt,
      render: (f) => formatDateTime(f.dueAt),
    },
    {
      key: "assignedToId",
      header: "Assigned User",
      value: (f) => lookups.userName(f.assignedToId),
      render: (f) => lookups.userName(f.assignedToId),
    },
    { key: "priority", header: "Priority", render: (f) => <StatusBadge value={f.priority} /> },
    { key: "status", header: "Status", render: (f) => <StatusBadge value={f.status} /> },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (f) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Follow-up actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {f.status === "OPEN" && (
              <DropdownMenuItem onClick={() => complete.mutate(f.id)}>Complete</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setEditing(f)}>Edit / Reschedule</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleting(f)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<FollowUp>[] = [
    { key: "priority", label: "Priority", options: PRIORITIES, match: (f, v) => f.priority === v },
    {
      key: "assignedToId",
      label: "Assigned To",
      options: lookups.users.map((u) => u.id),
      match: (f, v) => f.assignedToId === v,
      optionLabel: (id) => lookups.userName(id),
    },
  ];

  function table(rows: FollowUp[], emptyTitle: string, emptyDescription: string) {
    return (
      <DataTable
        rows={rows}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["title"]}
        filters={filters}
        exportName="follow-ups"
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Stay on top of every promised call, message, or visit."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add Follow-up
          </Button>
        }
      />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today ({buckets.today.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({buckets.upcoming.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({buckets.overdue.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({buckets.completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          {table(
            buckets.today,
            "Nothing due today",
            "Enjoy the clear schedule, or add a new follow-up.",
          )}
        </TabsContent>
        <TabsContent value="upcoming">
          {table(
            buckets.upcoming,
            "No upcoming follow-ups",
            "Scheduled follow-ups will show up here.",
          )}
        </TabsContent>
        <TabsContent value="overdue">
          {table(buckets.overdue, "No overdue follow-ups", "Great — everything is on schedule.")}
        </TabsContent>
        <TabsContent value="completed">
          {table(
            buckets.completed,
            "No completed follow-ups yet",
            "Completed tasks will appear here.",
          )}
        </TabsContent>
      </Tabs>

      <FollowUpFormDialog open={creating} onOpenChange={setCreating} />
      <FollowUpFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        followUp={editing ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete follow-up?"
        description="This action cannot be undone."
        confirmLabel="Delete Follow-up"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
