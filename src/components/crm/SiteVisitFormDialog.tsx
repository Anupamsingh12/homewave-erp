import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
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
import { siteVisitService } from "@/services";
import type { SiteVisit } from "@/types";

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

const siteVisitSchema = z.object({
  relationType: z.enum(["LEAD", "CUSTOMER"]),
  relatedId: z.string().min(1, "Select a lead or customer"),
  projectId: z.string().min(1, "Select a project"),
  visitAt: z.string().min(1, "Pick a visit date and time"),
  assignedToId: z.string().min(1, "Assign a salesperson"),
  visitors: z.coerce.number().int().min(1, "At least one visitor"),
  notes: z.string().optional(),
});

type SiteVisitFormValues = z.infer<typeof siteVisitSchema>;

export function SiteVisitFormDialog({
  open,
  onOpenChange,
  siteVisit,
  leadId,
  customerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  siteVisit?: SiteVisit | undefined;
  leadId?: string | undefined;
  customerId?: string | undefined;
  onSaved?: (siteVisit: SiteVisit) => void;
}) {
  const { leads, customers, users, projects } = useLookups();
  const locked = Boolean(leadId || customerId);

  const form = useForm<SiteVisitFormValues>({
    resolver: zodResolver(siteVisitSchema),
    defaultValues: {
      relationType: customerId ? "CUSTOMER" : "LEAD",
      relatedId: leadId ?? customerId ?? "",
      projectId: "",
      visitAt: "",
      assignedToId: "",
      visitors: 1,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (siteVisit) {
      form.reset({
        relationType: siteVisit.customerId ? "CUSTOMER" : "LEAD",
        relatedId: siteVisit.customerId ?? siteVisit.leadId ?? "",
        projectId: siteVisit.projectId,
        visitAt: toDatetimeLocal(siteVisit.visitAt),
        assignedToId: siteVisit.assignedToId,
        visitors: siteVisit.visitors,
        notes: siteVisit.notes,
      });
    } else {
      form.reset({
        relationType: customerId ? "CUSTOMER" : "LEAD",
        relatedId: leadId ?? customerId ?? "",
        projectId: "",
        visitAt: "",
        assignedToId: "",
        visitors: 1,
        notes: "",
      });
    }
  }, [open, siteVisit, leadId, customerId, form]);

  const relationType = form.watch("relationType");
  const relationOptions = useMemo(
    () => (relationType === "LEAD" ? leads : customers),
    [relationType, leads, customers],
  );

  const create = useAction(siteVisitService.create, {
    success: "Site visit scheduled",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<SiteVisit> }) =>
      siteVisitService.update(input.id, input.data),
    {
      success: "Site visit updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: SiteVisitFormValues) {
    const payload: Partial<SiteVisit> = {
      leadId: values.relationType === "LEAD" ? values.relatedId : null,
      customerId: values.relationType === "CUSTOMER" ? values.relatedId : null,
      projectId: values.projectId,
      visitAt: new Date(values.visitAt).toISOString(),
      assignedToId: values.assignedToId,
      visitors: values.visitors,
      notes: values.notes ?? "",
    };
    if (siteVisit) {
      update.mutate({ id: siteVisit.id, data: payload });
    } else {
      create.mutate({ ...payload, status: "SCHEDULED" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{siteVisit ? "Edit site visit" : "Schedule site visit"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!locked && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="relationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>For</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("relatedId", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LEAD">Lead</SelectItem>
                          <SelectItem value="CUSTOMER">Customer</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relatedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{relationType === "LEAD" ? "Lead" : "Customer"}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {relationOptions.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
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
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="visitAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit date & time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visitors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visitors</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned salesperson</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
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
                {pending ? "Saving…" : siteVisit ? "Save changes" : "Schedule visit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
