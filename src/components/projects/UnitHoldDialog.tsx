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
import { unitService } from "@/services";
import type { Unit } from "@/types";

const holdSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  salespersonId: z.string().min(1, "Select a salesperson"),
  hours: z.coerce.number().positive("Enter a valid duration"),
  reason: z.string().trim().min(2, "Add a reason for the hold"),
});

type HoldFormValues = z.infer<typeof holdSchema>;

export function UnitHoldDialog({
  open,
  onOpenChange,
  unit,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unit?: Unit | undefined;
  onSaved?: (unit: Unit) => void;
}) {
  const { customers, users } = useLookups();
  const salesUsers = users.filter((u) => u.role.startsWith("SALES"));
  const form = useForm<HoldFormValues>({
    resolver: zodResolver(holdSchema),
    defaultValues: { customerId: "", salespersonId: "", hours: 24, reason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ customerId: "", salespersonId: "", hours: 24, reason: "" });
  }, [open, form]);

  const hold = useAction(
    (input: { id: string; data: Parameters<typeof unitService.hold>[1] }) =>
      unitService.hold(input.id, input.data),
    {
      success: "Unit held",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );

  function onSubmit(values: HoldFormValues) {
    if (!unit) return;
    hold.mutate({ id: unit.id, data: values });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hold {unit?.code}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
              name="salespersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salesperson</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a salesperson" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {salesUsers.map((u) => (
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
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hold duration (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Awaiting token cheque" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={hold.isPending}>
                {hold.isPending ? "Holding…" : "Hold Unit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
