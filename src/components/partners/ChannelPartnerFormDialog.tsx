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
import { useAction } from "@/hooks/use-erp";
import { channelPartnerService } from "@/services";
import type { ChannelPartner } from "@/types";

const partnerSchema = z.object({
  company: z.string().trim().min(2, "Enter the company name"),
  contactPerson: z.string().trim().min(2, "Enter a contact person"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Enter a valid email address"),
  reraNumber: z.string().trim().min(1, "Enter the RERA registration number"),
  commissionPct: z.coerce.number().min(0, "Cannot be negative").max(100, "Maximum 100%"),
  city: z.string().trim().min(1, "Enter a city"),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

function emptyValues(): PartnerFormValues {
  return {
    company: "",
    contactPerson: "",
    phone: "",
    email: "",
    reraNumber: "",
    commissionPct: 2,
    city: "",
  };
}

export function ChannelPartnerFormDialog({
  open,
  onOpenChange,
  partner,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partner?: ChannelPartner | undefined;
  onSaved?: (partner: ChannelPartner) => void;
}) {
  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: emptyValues(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      partner
        ? {
            company: partner.company,
            contactPerson: partner.contactPerson,
            phone: partner.phone,
            email: partner.email,
            reraNumber: partner.reraNumber,
            commissionPct: partner.commissionPct,
            city: partner.city,
          }
        : emptyValues(),
    );
  }, [open, partner, form]);

  const create = useAction(channelPartnerService.create, {
    success: "Channel partner added",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<ChannelPartner> }) =>
      channelPartnerService.update(input.id, input.data),
    {
      success: "Channel partner updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: PartnerFormValues) {
    if (partner) {
      update.mutate({ id: partner.id, data: values });
    } else {
      create.mutate({ ...values, active: true });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partner ? "Edit channel partner" : "Add channel partner"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Prime Space Consultants" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact person</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input placeholder="98765 43210" {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reraNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RERA Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commissionPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission %</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} step={0.5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : partner ? "Save changes" : "Add Partner"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
