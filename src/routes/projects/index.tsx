import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { projectService } from "@/services";
import { formatDate } from "@/lib/format";
import type { Project, ProjectStatus } from "@/types";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});

const PROJECT_STATUSES: ProjectStatus[] = [
  "PLANNING",
  "ACTIVE",
  "ON_TRACK",
  "DELAYED",
  "COMPLETED",
];

function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useData(["projects", "all"], projectService.all);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const remove = useAction(projectService.remove, { success: "Project deleted" });
  const archive = useAction(
    (input: { id: string; archived: boolean }) =>
      projectService.update(input.id, { archived: input.archived }),
    { success: "Project updated" },
  );

  const activeProjects = (projects ?? []).filter((p) => !p.archived);

  const columns: Column<Project>[] = [
    { key: "name", header: "Project Name" },
    { key: "code", header: "Code" },
    { key: "city", header: "Location" },
    { key: "developer", header: "Developer" },
    { key: "reraNumber", header: "RERA Number" },
    {
      key: "startDate",
      header: "Start Date",
      value: (p) => p.startDate,
      render: (p) => formatDate(p.startDate),
    },
    {
      key: "completionDate",
      header: "Expected Completion",
      value: (p) => p.completionDate,
      render: (p) => formatDate(p.completionDate),
    },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    {
      key: "units",
      header: "Total Units",
      sortable: false,
      render: (p) => projectService.stats(p.id).total,
    },
    {
      key: "available",
      header: "Available",
      sortable: false,
      render: (p) => projectService.stats(p.id).available,
    },
    {
      key: "booked",
      header: "Booked",
      sortable: false,
      render: (p) => projectService.stats(p.id).booked,
    },
    {
      key: "sold",
      header: "Sold",
      sortable: false,
      render: (p) => projectService.stats(p.id).sold,
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
              aria-label="Project actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={() => navigate({ to: "/projects/$id", params: { id: p.id } })}
            >
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditing(p)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => archive.mutate({ id: p.id, archived: !p.archived })}>
              <Archive className="size-4" /> {p.archived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleting(p)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<Project>[] = [
    { key: "status", label: "Status", options: PROJECT_STATUSES, match: (p, v) => p.status === v },
    {
      key: "city",
      label: "City",
      options: [...new Set((projects ?? []).map((p) => p.city))],
      match: (p, v) => p.city === v,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every development you're building, from planning to possession."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Add Project
          </Button>
        }
      />
      <DataTable
        rows={activeProjects}
        columns={columns}
        loading={isLoading}
        searchFields={["name", "city", "code", "developer", "reraNumber"]}
        filters={filters}
        onRowClick={(p) => navigate({ to: "/projects/$id", params: { id: p.id } })}
        exportName="projects"
        emptyTitle="No projects found"
        emptyDescription="Create your first project to start building out inventory."
      />

      <ProjectFormDialog open={creating} onOpenChange={setCreating} />
      <ProjectFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        project={editing ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete project?"
        description={`This will permanently remove ${deleting?.name ?? "this project"}. This action cannot be undone.`}
        confirmLabel="Delete Project"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
