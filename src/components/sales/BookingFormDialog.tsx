import { useEffect, useMemo } from "react";
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
import { bookingService, unitService } from "@/services";
import { formatINR } from "@/lib/format";
import type { Booking } from "@/types";

const NONE = "NONE";

const bookingSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  unitId: z.string().min(1, "Select a unit"),
  bookingDate: z.string().min(1, "Pick a booking date"),
  bookingAmount: z.coerce.number().positive("Enter the booking amount"),
  agreementValue: z.coerce.number().positive("Enter the agreement value"),
  salespersonId: z.string().min(1, "Select a salesperson"),
  channelPartnerId: z.string(),
  paymentPlanId: z.string(),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BookingFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (booking: Booking) => void;
}) {
  const { customers, units, users, partners, plans } = useLookups();
  const salesUsers = users.filter((u) => u.role.startsWith("SALES"));
  const availableUnits = units.filter((u) => u.status === "AVAILABLE" || u.status === "HOLD");

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerId: "",
      unitId: "",
      bookingDate: today(),
      bookingAmount: 0,
      agreementValue: 0,
      salespersonId: "",
      channelPartnerId: NONE,
      paymentPlanId: NONE,
      notes: "",
    },
  });

  useEffect(() => {
    if (open)
      form.reset({
        customerId: "",
        unitId: "",
        bookingDate: today(),
        bookingAmount: 0,
        agreementValue: 0,
        salespersonId: "",
        channelPartnerId: NONE,
        paymentPlanId: NONE,
        notes: "",
      });
  }, [open, form]);

  const unitId = form.watch("unitId");
  const selectedUnit = useMemo(() => units.find((u) => u.id === unitId), [units, unitId]);

  useEffect(() => {
    if (selectedUnit) {
      const total = unitService.total(selectedUnit);
      form.setValue("agreementValue", total);
      form.setValue("bookingAmount", Math.round(total * 0.1));
    }
  }, [selectedUnit, form]);

  const create = useAction(bookingService.create, {
    success: "Booking created",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });

  function onSubmit(values: BookingFormValues) {
    create.mutate({
      customerId: values.customerId,
      unitId: values.unitId,
      bookingDate: new Date(values.bookingDate).toISOString(),
      bookingAmount: values.bookingAmount,
      agreementValue: values.agreementValue,
      salespersonId: values.salespersonId,
      channelPartnerId: values.channelPartnerId === NONE ? null : values.channelPartnerId,
      paymentPlanId: values.paymentPlanId === NONE ? null : values.paymentPlanId,
      notes: values.notes ?? "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
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
                            {c.name} ({c.code})
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
                name="unitId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Unit</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an available unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.code} · {u.bhk} BHK ·{" "}
                            {formatINR(unitService.total(u), { compact: true })}
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
                name="bookingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                          <SelectValue placeholder="Select" />
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
                name="bookingAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking amount</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agreementValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreement value</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment plan</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>No plan</SelectItem>
                        {plans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channelPartnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel partner</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Direct</SelectItem>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.company}
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
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Booking…" : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
