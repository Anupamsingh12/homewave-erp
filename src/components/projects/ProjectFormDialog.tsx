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
import { projectService } from "@/services";
import { titleize } from "@/lib/format";
import type { Project, ProjectStatus } from "@/types";

const PROJECT_STATUSES: ProjectStatus[] = [
  "PLANNING",
  "ACTIVE",
  "ON_TRACK",
  "DELAYED",
  "COMPLETED",
];

const projectSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name"),
  city: z.string().trim().min(1, "Enter a city"),
  address: z.string().optional(),
  developer: z.string().trim().min(1, "Enter the developer name"),
  reraNumber: z.string().trim().min(1, "Enter the RERA registration number"),
  startDate: z.string().min(1, "Pick a start date"),
  completionDate: z.string().min(1, "Pick an expected completion date"),
  status: z.enum(PROJECT_STATUSES as [ProjectStatus, ...ProjectStatus[]]),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

function toDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function emptyValues(): ProjectFormValues {
  return {
    name: "",
    city: "",
    address: "",
    developer: "Buildwell Developers Pvt. Ltd.",
    reraNumber: "",
    startDate: "",
    completionDate: "",
    status: "PLANNING",
    description: "",
  };
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project | undefined;
  onSaved?: (project: Project) => void;
}) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: emptyValues(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      project
        ? {
            name: project.name,
            city: project.city,
            address: project.address,
            developer: project.developer,
            reraNumber: project.reraNumber,
            startDate: toDateInput(project.startDate),
            completionDate: toDateInput(project.completionDate),
            status: project.status,
            description: project.description,
          }
        : emptyValues(),
    );
  }, [open, project, form]);

  const create = useAction(projectService.create, {
    success: "Project created",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<Project> }) => projectService.update(input.id, input.data),
    {
      success: "Project updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: ProjectFormValues) {
    const payload: Partial<Project> = {
      name: values.name,
      city: values.city,
      address: values.address ?? "",
      developer: values.developer,
      reraNumber: values.reraNumber,
      startDate: new Date(values.startDate).toISOString(),
      completionDate: new Date(values.completionDate).toISOString(),
      status: values.status,
      description: values.description ?? "",
    };
    if (project) {
      update.mutate({ id: project.id, data: payload });
    } else {
      create.mutate({ ...payload, archived: false });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "Add project"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Project name</FormLabel>
                    <FormControl>
                      <Input placeholder="Green Heights" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="developer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Developer</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Plot, sector, city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reraNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RERA Number</FormLabel>
                    <FormControl>
                      <Input placeholder="P51234567" {...field} />
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
                        {PROJECT_STATUSES.map((s) => (
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
                name="completionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected completion</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
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
                {pending ? "Saving…" : project ? "Save changes" : "Add project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
