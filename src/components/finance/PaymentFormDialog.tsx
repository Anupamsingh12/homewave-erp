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
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { invoiceService, paymentService } from "@/services";
import { formatINR } from "@/lib/format";
import type { Payment, PaymentMode } from "@/types";

const PAYMENT_MODES: PaymentMode[] = [
  "BANK_TRANSFER",
  "UPI",
  "CHEQUE",
  "CASH",
  "CARD",
  "NEFT",
  "RTGS",
  "OTHER",
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Select an invoice"),
  paymentDate: z.string().min(1, "Pick a payment date"),
  amount: z.coerce.number().positive("Enter the amount received"),
  mode: z.enum(PAYMENT_MODES as [PaymentMode, ...PaymentMode[]]),
  reference: z.string().trim().min(1, "Enter a reference number"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function PaymentFormDialog({
  open,
  onOpenChange,
  invoiceId: presetInvoiceId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoiceId?: string | undefined;
  onSaved?: (payment: Payment) => void;
}) {
  const lookups = useLookups();
  const { data: invoices } = useData(["invoices", "all"], invoiceService.all);
  const outstandingInvoices = useMemo(
    () =>
      (invoices ?? [])
        .filter((i) => i.status !== "DRAFT" && i.status !== "CANCELLED")
        .map((i) => ({ invoice: i, summary: invoiceService.summary(i) }))
        .filter(({ summary }) => summary.outstanding > 0),
    [invoices],
  );

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: presetInvoiceId ?? "",
      paymentDate: today(),
      amount: 0,
      mode: "BANK_TRANSFER",
      reference: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    const preset = outstandingInvoices.find((x) => x.invoice.id === presetInvoiceId);
    form.reset({
      invoiceId: presetInvoiceId ?? "",
      paymentDate: today(),
      amount: preset?.summary.outstanding ?? 0,
      mode: "BANK_TRANSFER",
      reference: "",
      notes: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetInvoiceId]);

  const invoiceId = form.watch("invoiceId");
  useEffect(() => {
    const match = outstandingInvoices.find((x) => x.invoice.id === invoiceId);
    if (match) form.setValue("amount", match.summary.outstanding);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const record = useAction(paymentService.create, {
    success: "Payment recorded",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });

  function onSubmit(values: PaymentFormValues) {
    const match = outstandingInvoices.find((x) => x.invoice.id === values.invoiceId);
    if (!match) return;
    record.mutate({
      invoiceId: match.invoice.id,
      bookingId: match.invoice.bookingId,
      customerId: match.invoice.customerId,
      paymentDate: new Date(values.paymentDate).toISOString(),
      amount: values.amount,
      mode: values.mode,
      reference: values.reference,
      status: "SUCCESS",
      notes: values.notes ?? "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an invoice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {outstandingInvoices.map(({ invoice, summary }) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.code} · {lookups.customerName(invoice.customerId)} · Due{" "}
                          {formatINR(summary.outstanding, { compact: true })}
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
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment date</FormLabel>
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
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment mode</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.replace(/_/g, " ")}
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference number</FormLabel>
                  <FormControl>
                    <Input placeholder="UTR / cheque / transaction ID" {...field} />
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
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={record.isPending}>
                {record.isPending ? "Recording…" : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
