import { FileSignature, XCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FieldList } from "@/components/shared/DetailCard";
import { useLookups } from "@/hooks/use-lookups";
import { useAction } from "@/hooks/use-erp";
import { bookingService } from "@/services";
import { formatDate, formatINR } from "@/lib/format";
import type { Booking } from "@/types";

export function BookingDetailSheet({
  booking,
  onOpenChange,
}: {
  booking: Booking | null;
  onOpenChange: (v: boolean) => void;
}) {
  const lookups = useLookups();
  const cancel = useAction(
    (input: { id: string; reason: string }) => bookingService.cancel(input.id, input.reason),
    { success: "Booking cancelled", onDone: () => onOpenChange(false) },
  );
  const generateAgreement = useAction(bookingService.generateAgreement, {
    success: "Agreement generated",
  });

  const finance = booking ? bookingService.finance(booking.id) : null;

  return (
    <Sheet open={Boolean(booking)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {booking && finance && (
          <>
            <SheetHeader>
              <SheetTitle>{booking.code}</SheetTitle>
              <SheetDescription>
                {lookups.customerName(booking.customerId)} ·{" "}
                {lookups.projectName(booking.projectId)} / {lookups.unitCode(booking.unitId)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-6 px-4">
              <StatusBadge value={booking.status} />

              <FieldList
                items={[
                  { label: "Booking Date", value: formatDate(booking.bookingDate) },
                  { label: "Salesperson", value: lookups.userName(booking.salespersonId) },
                  {
                    label: "Channel Partner",
                    value: lookups.partnerName(booking.channelPartnerId),
                  },
                  { label: "Payment Plan", value: lookups.planName(booking.paymentPlanId) },
                ]}
              />

              <div className="rounded-lg border border-border p-4">
                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Financial Summary
                </p>
                <FieldList
                  items={[
                    { label: "Agreement Value", value: formatINR(finance.agreementValue) },
                    { label: "Paid", value: formatINR(finance.paid) },
                    { label: "Due", value: formatINR(finance.due) },
                    { label: "Overdue", value: formatINR(finance.overdue) },
                  ]}
                />
              </div>

              {booking.notes && <FieldList items={[{ label: "Notes", value: booking.notes }]} />}

              {booking.status !== "CANCELLED" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => generateAgreement.mutate(booking.id)}
                    disabled={generateAgreement.isPending}
                  >
                    <FileSignature className="size-4" /> Generate Agreement
                  </Button>
                  {booking.status !== "COMPLETED" && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        cancel.mutate({ id: booking.id, reason: "Cancelled by admin" })
                      }
                      disabled={cancel.isPending}
                    >
                      <XCircle className="size-4" /> Cancel Booking
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
