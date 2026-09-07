import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAction } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { leadService } from "@/services";
import { formatINR, formatDate, titleize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead, LeadSource } from "@/types";

const LEAD_SOURCES: LeadSource[] = [
  "WEBSITE",
  "WALK_IN",
  "REFERRAL",
  "CHANNEL_PARTNER",
  "FACEBOOK",
  "GOOGLE_ADS",
  "PROPERTY_PORTAL",
  "EXHIBITION",
];

const NO_PROJECT = "NONE";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Enter the lead's full name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Enter a valid email address"),
  source: z.enum(LEAD_SOURCES as [LeadSource, ...LeadSource[]]),
  projectId: z.string(),
  budget: z.coerce.number().positive("Budget must be greater than ₹0"),
  assignedToId: z.string().min(1, "Assign this lead to a team member"),
  nextFollowUpAt: z.string().optional(),
  requirement: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function emptyValues(): LeadFormValues {
  return {
    name: "",
    phone: "",
    email: "",
    source: "WEBSITE",
    projectId: NO_PROJECT,
    budget: 0,
    assignedToId: "",
    nextFollowUpAt: undefined,
    requirement: "",
    notes: "",
  };
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead?: Lead | undefined;
  onSaved?: (lead: Lead) => void;
}) {
  const { projects, users } = useLookups();
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: emptyValues(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      lead
        ? {
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            source: lead.source,
            projectId: lead.projectId ?? NO_PROJECT,
            budget: lead.budget,
            assignedToId: lead.assignedToId,
            nextFollowUpAt: lead.nextFollowUpAt ?? undefined,
            requirement: lead.requirement,
            notes: lead.notes,
          }
        : emptyValues(),
    );
  }, [open, lead, form]);

  const create = useAction(leadService.create, {
    success: "Lead created",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<Lead> }) => leadService.update(input.id, input.data),
    {
      success: "Lead updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );

  const pending = create.isPending || update.isPending;

  function onSubmit(values: LeadFormValues) {
    const payload: Partial<Lead> = {
      name: values.name,
      phone: values.phone,
      email: values.email,
      source: values.source,
      projectId: values.projectId === NO_PROJECT ? null : values.projectId,
      budget: values.budget,
      assignedToId: values.assignedToId,
      nextFollowUpAt: values.nextFollowUpAt ?? null,
      requirement: values.requirement ?? "",
      notes: values.notes ?? "",
    };
    if (lead) {
      update.mutate({ id: lead.id, data: payload });
    } else {
      create.mutate({ ...payload, status: "NEW", channelPartnerId: null });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit lead" : "Add lead"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Rajesh Kumar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="98765 43210" inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="rajesh@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_SOURCES.map((s) => (
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
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interested project</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_PROJECT}>No project selected</SelectItem>
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
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={100000} {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {formatINR(Number(field.value) || 0, { compact: true })}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="nextFollowUpAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Next follow-up</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="size-4" />
                            {field.value ? formatDate(field.value) : "No date set"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) => field.onChange(d ? d.toISOString() : undefined)}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="requirement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. 3 BHK, ready to move, Mumbai West"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : lead ? "Save changes" : "Add lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
