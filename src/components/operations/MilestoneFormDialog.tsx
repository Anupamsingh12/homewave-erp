import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAction } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { constructionService } from "@/services";
import { titleize } from "@/lib/format";
import type { ConstructionMilestone, MilestoneStatus } from "@/types";

const STATUSES: MilestoneStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ON_TRACK",
  "DELAYED",
  "COMPLETED",
];

function toDateInput(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

const milestoneSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  name: z.string().trim().min(1, "Enter a milestone name"),
  sequence: z.coerce.number().int().min(1, "Enter a sequence number"),
  startDate: z.string().min(1, "Pick a start date"),
  expectedDate: z.string().min(1, "Pick an expected date"),
  actualDate: z.string().optional(),
  progress: z.coerce.number().min(0, "Minimum 0%").max(100, "Maximum 100%"),
  status: z.enum(STATUSES as [MilestoneStatus, ...MilestoneStatus[]]),
  notes: z.string().optional(),
});

type MilestoneFormValues = z.infer<typeof milestoneSchema>;

function emptyValues(projectId: string): MilestoneFormValues {
  return {
    projectId,
    name: "",
    sequence: 1,
    startDate: "",
    expectedDate: "",
    actualDate: "",
    progress: 0,
    status: "NOT_STARTED",
    notes: "",
  };
}

export function MilestoneFormDialog({
  open,
  onOpenChange,
  milestone,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  milestone?: ConstructionMilestone | undefined;
  onSaved?: (milestone: ConstructionMilestone) => void;
}) {
  const { projects } = useLookups();
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: emptyValues(""),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      milestone
        ? {
            projectId: milestone.projectId,
            name: milestone.name,
            sequence: milestone.sequence,
            startDate: toDateInput(milestone.startDate),
            expectedDate: toDateInput(milestone.expectedDate),
            actualDate: toDateInput(milestone.actualDate),
            progress: milestone.progress,
            status: milestone.status,
            notes: milestone.notes,
          }
        : emptyValues(projects[0]?.id ?? ""),
    );
  }, [open, milestone, form, projects]);

  const create = useAction(constructionService.create, {
    success: "Milestone added",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<ConstructionMilestone> }) =>
      constructionService.update(input.id, input.data),
    {
      success: "Milestone updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: MilestoneFormValues) {
    const payload: Partial<ConstructionMilestone> = {
      projectId: values.projectId,
      name: values.name,
      sequence: values.sequence,
      startDate: new Date(values.startDate).toISOString(),
      expectedDate: new Date(values.expectedDate).toISOString(),
      actualDate: values.actualDate ? new Date(values.actualDate).toISOString() : null,
      progress: values.progress,
      status: values.status,
      notes: values.notes ?? "",
    };
    if (milestone) {
      update.mutate({ id: milestone.id, data: payload });
    } else {
      create.mutate(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit milestone" : "Add milestone"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Project</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone name</FormLabel>
                    <FormControl>
                      <Input placeholder="Foundation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sequence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sequence</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actualDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {titleize(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : milestone ? "Save changes" : "Add milestone"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
