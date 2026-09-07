import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
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
import { paymentPlanService } from "@/services";
import type { PaymentPlan } from "@/types";

const NO_PROJECT = "ALL";

const milestoneSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Enter a milestone name"),
  percentage: z.coerce.number().min(0, "Minimum 0%").max(100, "Maximum 100%"),
  dueType: z.enum(["BOOKING", "DATE", "CONSTRUCTION"]),
  dueDate: z.string().optional(),
  constructionMilestone: z.string().optional(),
});

const planSchema = z.object({
  name: z.string().trim().min(2, "Enter a plan name"),
  projectId: z.string(),
  description: z.string().optional(),
  milestones: z.array(milestoneSchema).min(1, "Add at least one milestone"),
});

type PlanFormValues = z.infer<typeof planSchema>;

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyValues(): PlanFormValues {
  return {
    name: "",
    projectId: NO_PROJECT,
    description: "",
    milestones: [
      {
        id: randomId(),
        name: "Booking Amount",
        percentage: 10,
        dueType: "BOOKING",
        dueDate: "",
        constructionMilestone: "",
      },
      {
        id: randomId(),
        name: "Possession",
        percentage: 90,
        dueType: "CONSTRUCTION",
        dueDate: "",
        constructionMilestone: "Possession",
      },
    ],
  };
}

export function PaymentPlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan?: PaymentPlan | undefined;
  onSaved?: (plan: PaymentPlan) => void;
}) {
  const { projects } = useLookups();
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: emptyValues(),
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "milestones" });

  useEffect(() => {
    if (!open) return;
    form.reset(
      plan
        ? {
            name: plan.name,
            projectId: plan.projectId ?? NO_PROJECT,
            description: plan.description,
            milestones: plan.milestones.map((m) => ({
              id: m.id,
              name: m.name,
              percentage: m.percentage,
              dueType: m.dueType,
              dueDate: m.dueDate ?? "",
              constructionMilestone: m.constructionMilestone ?? "",
            })),
          }
        : emptyValues(),
    );
  }, [open, plan, form]);

  const milestones = form.watch("milestones");
  const totalPct = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);

  const create = useAction(paymentPlanService.create, {
    success: "Payment plan created",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<PaymentPlan> }) =>
      paymentPlanService.update(input.id, input.data),
    {
      success: "Payment plan updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: PlanFormValues) {
    if (Math.round(values.milestones.reduce((s, m) => s + m.percentage, 0)) !== 100) {
      form.setError("milestones", { message: "Milestone percentages must add up to 100%" });
      return;
    }
    const payload: Partial<PaymentPlan> = {
      name: values.name,
      projectId: values.projectId === NO_PROJECT ? null : values.projectId,
      description: values.description ?? "",
      milestones: values.milestones.map((m) => ({
        id: m.id,
        name: m.name,
        percentage: m.percentage,
        dueType: m.dueType,
        dueDate: m.dueType === "DATE" && m.dueDate ? new Date(m.dueDate).toISOString() : null,
        constructionMilestone:
          m.dueType === "CONSTRUCTION" ? m.constructionMilestone || null : null,
      })),
    };
    if (plan) {
      update.mutate({ id: plan.id, data: payload });
    } else {
      create.mutate(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit payment plan" : "New payment plan"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan name</FormLabel>
                    <FormControl>
                      <Input placeholder="Construction Linked Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_PROJECT}>All Projects</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Milestones <span className="text-muted-foreground">({totalPct}% of 100%)</span>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    append({
                      id: randomId(),
                      name: "",
                      percentage: 0,
                      dueType: "DATE",
                      dueDate: "",
                      constructionMilestone: "",
                    })
                  }
                >
                  <Plus className="size-4" /> Add milestone
                </Button>
              </div>
              {form.formState.errors.milestones?.message && (
                <p className="mb-2 text-xs font-medium text-destructive">
                  {form.formState.errors.milestones.message}
                </p>
              )}
              <div className="space-y-3">
                {fields.map((f, idx) => {
                  const dueType = form.watch(`milestones.${idx}.dueType`);
                  return (
                    <div
                      key={f.id}
                      className="grid grid-cols-12 items-start gap-2 rounded-lg border border-border p-3"
                    >
                      <FormField
                        control={form.control}
                        name={`milestones.${idx}.name`}
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormControl>
                              <Input placeholder="Milestone name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`milestones.${idx}.percentage`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormControl>
                              <Input type="number" min={0} max={100} placeholder="%" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`milestones.${idx}.dueType`}
                        render={({ field }) => (
                          <FormItem className="col-span-3">
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="BOOKING">On Booking</SelectItem>
                                <SelectItem value="DATE">Fixed Date</SelectItem>
                                <SelectItem value="CONSTRUCTION">Construction Milestone</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      {dueType === "DATE" && (
                        <FormField
                          control={form.control}
                          name={`milestones.${idx}.dueDate`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                      {dueType === "CONSTRUCTION" && (
                        <FormField
                          control={form.control}
                          name={`milestones.${idx}.constructionMilestone`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormControl>
                                <Input placeholder="e.g. Foundation" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="col-span-1 text-destructive hover:text-destructive"
                        onClick={() => remove(idx)}
                        disabled={fields.length <= 1}
                        aria-label="Remove milestone"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : plan ? "Save changes" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
