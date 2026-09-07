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
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { bookingService, invoiceService } from "@/services";
import type { Invoice } from "@/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function plus15(): string {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().slice(0, 10);
}

const invoiceSchema = z.object({
  bookingId: z.string().min(1, "Select a booking"),
  demandType: z.string().trim().min(2, "Describe this demand"),
  issueDate: z.string().min(1, "Pick an issue date"),
  dueDate: z.string().min(1, "Pick a due date"),
  amount: z.coerce.number().positive("Enter an amount"),
  taxRate: z.coerce.number().min(0, "Cannot be negative").max(50, "That looks too high"),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function InvoiceFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (invoice: Invoice) => void;
}) {
  const lookups = useLookups();
  const { data: bookings } = useData(["bookings", "all"], bookingService.all);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      bookingId: "",
      demandType: "",
      issueDate: today(),
      dueDate: plus15(),
      amount: 0,
      taxRate: 5,
      notes: "",
    },
  });

  useEffect(() => {
    if (open)
      form.reset({
        bookingId: "",
        demandType: "",
        issueDate: today(),
        dueDate: plus15(),
        amount: 0,
        taxRate: 5,
        notes: "",
      });
  }, [open, form]);

  const create = useAction(invoiceService.create, {
    success: "Invoice created",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });

  function onSubmit(values: InvoiceFormValues) {
    const booking = (bookings ?? []).find((b) => b.id === values.bookingId);
    if (!booking) return;
    create.mutate({
      bookingId: booking.id,
      customerId: booking.customerId,
      unitId: booking.unitId,
      demandType: values.demandType,
      issueDate: new Date(values.issueDate).toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
      amount: values.amount,
      taxRate: values.taxRate,
      status: "DRAFT",
      notes: values.notes ?? "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New demand / invoice</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bookingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a booking" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(bookings ?? [])
                        .filter((b) => b.status !== "CANCELLED")
                        .map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.code} · {lookups.customerName(b.customerId)}
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
              name="demandType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Demand type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Slab Casting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax (GST %)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={50} {...field} />
                    </FormControl>
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
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
