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
import { agreementService, bookingService } from "@/services";
import { formatINR } from "@/lib/format";
import type { Agreement } from "@/types";

const agreementSchema = z.object({
  bookingId: z.string().min(1, "Select a booking"),
  agreementDate: z.string().min(1, "Pick an agreement date"),
  agreementValue: z.coerce.number().positive("Enter the agreement value"),
  notes: z.string().optional(),
});

type AgreementFormValues = z.infer<typeof agreementSchema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AgreementFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (agreement: Agreement) => void;
}) {
  const lookups = useLookups();
  const { data: bookings } = useData(["bookings", "all"], bookingService.all);
  const { data: agreements } = useData(["agreements", "all"], agreementService.all);
  const bookingsWithoutAgreement = (bookings ?? []).filter(
    (b) => b.status !== "CANCELLED" && !(agreements ?? []).some((a) => a.bookingId === b.id),
  );

  const form = useForm<AgreementFormValues>({
    resolver: zodResolver(agreementSchema),
    defaultValues: { bookingId: "", agreementDate: today(), agreementValue: 0, notes: "" },
  });

  useEffect(() => {
    if (open) form.reset({ bookingId: "", agreementDate: today(), agreementValue: 0, notes: "" });
  }, [open, form]);

  const bookingId = form.watch("bookingId");
  useEffect(() => {
    const booking = bookings?.find((b) => b.id === bookingId);
    if (booking) form.setValue("agreementValue", booking.agreementValue);
  }, [bookingId, bookings, form]);

  const create = useAction(agreementService.create, {
    success: "Agreement created",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });

  function onSubmit(values: AgreementFormValues) {
    create.mutate({
      bookingId: values.bookingId,
      agreementDate: new Date(values.agreementDate).toISOString(),
      agreementValue: values.agreementValue,
      status: "DRAFT",
      notes: values.notes ?? "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New agreement</DialogTitle>
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
                      {bookingsWithoutAgreement.map((b) => (
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
              name="agreementDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreement date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <p className="text-xs text-muted-foreground">
                    {formatINR(Number(field.value) || 0, { compact: true })}
                  </p>
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
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Create Agreement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
