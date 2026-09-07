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
import { followUpService } from "@/services";
import { titleize } from "@/lib/format";
import type { FollowUp, Priority } from "@/types";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

const followUpSchema = z.object({
  relationType: z.enum(["LEAD", "CUSTOMER"]),
  relatedId: z.string().min(1, "Select a lead or customer"),
  title: z.string().trim().min(2, "Describe the task"),
  dueAt: z.string().min(1, "Pick a due date and time"),
  assignedToId: z.string().min(1, "Assign this task to a team member"),
  priority: z.enum(PRIORITIES as [Priority, ...Priority[]]),
  notes: z.string().optional(),
});

type FollowUpFormValues = z.infer<typeof followUpSchema>;

export function FollowUpFormDialog({
  open,
  onOpenChange,
  followUp,
  leadId,
  customerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  followUp?: FollowUp | undefined;
  leadId?: string | undefined;
  customerId?: string | undefined;
  onSaved?: (followUp: FollowUp) => void;
}) {
  const { leads, customers, users } = useLookups();
  const locked = Boolean(leadId || customerId);

  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      relationType: customerId ? "CUSTOMER" : "LEAD",
      relatedId: leadId ?? customerId ?? "",
      title: "",
      dueAt: "",
      assignedToId: "",
      priority: "MEDIUM",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (followUp) {
      form.reset({
        relationType: followUp.customerId ? "CUSTOMER" : "LEAD",
        relatedId: followUp.customerId ?? followUp.leadId ?? "",
        title: followUp.title,
        dueAt: toDatetimeLocal(followUp.dueAt),
        assignedToId: followUp.assignedToId,
        priority: followUp.priority,
        notes: followUp.notes,
      });
    } else {
      form.reset({
        relationType: customerId ? "CUSTOMER" : "LEAD",
        relatedId: leadId ?? customerId ?? "",
        title: "",
        dueAt: "",
        assignedToId: "",
        priority: "MEDIUM",
        notes: "",
      });
    }
  }, [open, followUp, leadId, customerId, form]);

  const relationType = form.watch("relationType");
  const relationOptions = useMemo(
    () => (relationType === "LEAD" ? leads : customers),
    [relationType, leads, customers],
  );

  const create = useAction(followUpService.create, {
    success: "Follow-up scheduled",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<FollowUp> }) =>
      followUpService.update(input.id, input.data),
    {
      success: "Follow-up updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: FollowUpFormValues) {
    const payload: Partial<FollowUp> = {
      leadId: values.relationType === "LEAD" ? values.relatedId : null,
      customerId: values.relationType === "CUSTOMER" ? values.relatedId : null,
      title: values.title,
      dueAt: new Date(values.dueAt).toISOString(),
      assignedToId: values.assignedToId,
      priority: values.priority,
      notes: values.notes ?? "",
    };
    if (followUp) {
      update.mutate({ id: followUp.id, data: payload });
    } else {
      create.mutate({ ...payload, status: "OPEN" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{followUp ? "Edit follow-up" : "Add follow-up"}</DialogTitle>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task</FormLabel>
                  <FormControl>
                    <Input placeholder="Call to confirm site visit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dueAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {titleize(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned to</FormLabel>
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
                {pending ? "Saving…" : followUp ? "Save changes" : "Add follow-up"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
