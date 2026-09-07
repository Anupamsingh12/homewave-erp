import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel, FieldList } from "@/components/shared/DetailCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { KpiCard } from "@/components/shared/KpiCard";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { TowerFormDialog } from "@/components/projects/TowerFormDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { projectService, towerService } from "@/services";
import { formatDate, formatINR } from "@/lib/format";
import type { Tower } from "@/types";

export const Route = createFileRoute("/projects/$id")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const {
    data: project,
    isLoading,
    isError,
  } = useData(["projects", id], () => projectService.getById(id));
  const { data: towers } = useData(["towers", "all"], towerService.all);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingTower, setAddingTower] = useState(false);
  const [editingTower, setEditingTower] = useState<Tower | null>(null);
  const [deletingTower, setDeletingTower] = useState<Tower | null>(null);

  const remove = useAction(projectService.remove, {
    success: "Project deleted",
    onDone: () => navigate({ to: "/projects" }),
  });
  const archive = useAction(
    (input: { id: string; archived: boolean }) =>
      projectService.update(input.id, { archived: input.archived }),
    { success: "Project updated" },
  );
  const removeTower = useAction(towerService.remove, { success: "Tower removed" });

  if (isError) {
    return (
      <EmptyState
        title="Project not found"
        description="This project may have been deleted, or the link is incorrect."
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/projects" })}>
            Back to Projects
          </Button>
        }
      />
    );
  }

  if (isLoading || !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const stats = projectService.stats(id);
  const projectTowers = (towers ?? []).filter((t) => t.projectId === id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => archive.mutate({ id: project.id, archived: !project.archived })}
            >
              <Archive className="size-4" /> {project.archived ? "Unarchive" : "Archive"}
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
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <StatusBadge value={project.status} />
          <span>{project.city}</span>
          <span>RERA: {project.reraNumber}</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Units" value={String(stats.total)} />
        <KpiCard label="Available" value={String(stats.available)} accent="success" />
        <KpiCard label="Booked" value={String(stats.booked)} accent="info" />
        <KpiCard label="Sold" value={String(stats.sold)} accent="warning" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Sales Value" value={formatINR(stats.salesValue, { compact: true })} />
        <KpiCard
          label="Collected"
          value={formatINR(stats.collected, { compact: true })}
          accent="success"
        />
        <KpiCard
          label="Outstanding"
          value={formatINR(stats.outstanding, { compact: true })}
          accent="warning"
        />
      </div>

      <Panel title="Overview">
        <FieldList
          items={[
            { label: "Developer", value: project.developer },
            { label: "Address", value: project.address || "—" },
            { label: "Start Date", value: formatDate(project.startDate) },
            { label: "Expected Completion", value: formatDate(project.completionDate) },
            { label: "Description", value: project.description || "—" },
          ]}
        />
      </Panel>

      <Panel
        title="Towers / Buildings"
        actions={
          <Button variant="ghost" size="sm" onClick={() => setAddingTower(true)}>
            <Plus className="size-4" /> Add Tower
          </Button>
        }
      >
        {projectTowers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Tower", "Code", "Floors", "Units", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectTowers.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-3">{t.code}</td>
                    <td className="px-4 py-3">{t.floors}</td>
                    <td className="px-4 py-3">{t.floors * t.unitsPerFloor}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Tower actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTower(t)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => setDeletingTower(t)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No towers yet"
            description="Add a tower to start building out this project's inventory."
          />
        )}
      </Panel>

      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={project} />
      <TowerFormDialog open={addingTower} onOpenChange={setAddingTower} projectId={id} />
      <TowerFormDialog
        open={Boolean(editingTower)}
        onOpenChange={(v) => !v && setEditingTower(null)}
        projectId={id}
        tower={editingTower ?? undefined}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete project?"
        description={`This will permanently remove ${project.name}. This action cannot be undone.`}
        confirmLabel="Delete Project"
        destructive
        onConfirm={() => remove.mutate(project.id)}
      />
      <ConfirmDialog
        open={Boolean(deletingTower)}
        onOpenChange={(v) => !v && setDeletingTower(null)}
        title="Delete tower?"
        description="This action cannot be undone."
        confirmLabel="Delete Tower"
        destructive
        onConfirm={() => {
          if (deletingTower) removeTower.mutate(deletingTower.id);
          setDeletingTower(null);
        }}
      />
    </div>
  );
}
