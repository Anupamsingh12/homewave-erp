import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { endOfDay, startOfDay } from "date-fns";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SiteVisitFormDialog } from "@/components/crm/SiteVisitFormDialog";
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
import { siteVisitService } from "@/services";
import { formatDateTime } from "@/lib/format";
import type { SiteVisit, SiteVisitStatus } from "@/types";

export const Route = createFileRoute("/site-visits")({
  component: SiteVisitsPage,
});

function SiteVisitsPage() {
  const lookups = useLookups();
  const { data: visits, isLoading } = useData(["siteVisits", "all"], siteVisitService.all);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SiteVisit | null>(null);
  const [deleting, setDeleting] = useState<SiteVisit | null>(null);

  const remove = useAction(siteVisitService.remove, { success: "Site visit deleted" });
  const setStatus = useAction(
    (input: { id: string; status: SiteVisitStatus }) =>
      siteVisitService.update(input.id, { status: input.status }),
    { success: "Site visit updated" },
  );

  const buckets = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const rows = visits ?? [];
    return {
      today: rows.filter((v) => {
        const t = new Date(v.visitAt).getTime();
        return v.status === "SCHEDULED" && t >= todayStart && t <= todayEnd;
      }),
      upcoming: rows.filter(
        (v) => v.status === "SCHEDULED" && new Date(v.visitAt).getTime() > todayEnd,
      ),
      past: rows.filter(
        (v) => v.status !== "SCHEDULED" || new Date(v.visitAt).getTime() < todayStart,
      ),
    };
  }, [visits]);

  const columns: Column<SiteVisit>[] = [
    { key: "related", header: "Customer / Lead", render: (v) => lookups.relatedName(v) },
    {
      key: "projectId",
      header: "Project",
      value: (v) => lookups.projectName(v.projectId),
      render: (v) => lookups.projectName(v.projectId),
    },
    {
      key: "visitAt",
      header: "Visit Date & Time",
      value: (v) => v.visitAt,
      render: (v) => formatDateTime(v.visitAt),
    },
    {
      key: "assignedToId",
      header: "Salesperson",
      value: (v) => lookups.userName(v.assignedToId),
      render: (v) => lookups.userName(v.assignedToId),
    },
    { key: "visitors", header: "Visitors" },
    { key: "status", header: "Status", render: (v) => <StatusBadge value={v.status} /> },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (v) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Site visit actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {v.status === "SCHEDULED" && (
              <>
                <DropdownMenuItem
                  onClick={() => setStatus.mutate({ id: v.id, status: "COMPLETED" })}
                >
                  Mark completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatus.mutate({ id: v.id, status: "NO_SHOW" })}>
                  Mark no-show
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatus.mutate({ id: v.id, status: "CANCELLED" })}
                >
                  Cancel
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => setEditing(v)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleting(v)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<SiteVisit>[] = [
    {
      key: "projectId",
      label: "Project",
      options: lookups.projects.map((p) => p.id),
      match: (v, val) => v.projectId === val,
      optionLabel: (id) => lookups.projectName(id),
    },
    {
      key: "assignedToId",
      label: "Salesperson",
      options: lookups.users.map((u) => u.id),
      match: (v, val) => v.assignedToId === val,
      optionLabel: (id) => lookups.userName(id),
    },
  ];

  function table(rows: SiteVisit[], emptyTitle: string, emptyDescription: string) {
    return (
      <DataTable
        rows={rows}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["code", "notes"]}
        filters={filters}
        exportName="site-visits"
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Site Visits"
        description="Coordinate every project walkthrough with leads and customers."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Schedule Site Visit
          </Button>
        }
      />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today ({buckets.today.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({buckets.upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({buckets.past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          {table(
            buckets.today,
            "No visits scheduled today",
            "Site visits happening today will show up here.",
          )}
        </TabsContent>
        <TabsContent value="upcoming">
          {table(
            buckets.upcoming,
            "No upcoming visits",
            "Scheduled site visits will show up here.",
          )}
        </TabsContent>
        <TabsContent value="past">
          {table(
            buckets.past,
            "No past visits",
            "Completed, cancelled, and no-show visits will show up here.",
          )}
        </TabsContent>
      </Tabs>

      <SiteVisitFormDialog open={creating} onOpenChange={setCreating} />
      <SiteVisitFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        siteVisit={editing ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete site visit?"
        description="This action cannot be undone."
        confirmLabel="Delete Site Visit"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
