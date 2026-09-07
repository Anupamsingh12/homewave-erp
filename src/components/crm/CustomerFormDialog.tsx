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
import { customerService } from "@/services";
import { titleize } from "@/lib/format";
import type { Customer, LeadSource } from "@/types";

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

const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer's full name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Enter a valid email address"),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (v) => v === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v),
      "Enter a valid PAN, e.g. ABCDE1234F",
    ),
  address: z.string().optional(),
  city: z.string().trim().min(1, "Enter a city"),
  source: z.enum(LEAD_SOURCES as [LeadSource, ...LeadSource[]]),
  assignedToId: z.string().min(1, "Assign this customer to a team member"),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function emptyValues(): CustomerFormValues {
  return {
    name: "",
    phone: "",
    email: "",
    pan: "",
    address: "",
    city: "",
    source: "WEBSITE",
    assignedToId: "",
  };
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer?: Customer | undefined;
  onSaved?: (customer: Customer) => void;
}) {
  const { users } = useLookups();
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: emptyValues(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      customer
        ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            pan: customer.pan,
            address: customer.address,
            city: customer.city,
            source: customer.source,
            assignedToId: customer.assignedToId,
          }
        : emptyValues(),
    );
  }, [open, customer, form]);

  const create = useAction(customerService.create, {
    success: "Customer created",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<Customer> }) =>
      customerService.update(input.id, input.data),
    {
      success: "Customer updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: CustomerFormValues) {
    const payload: Partial<Customer> = {
      name: values.name,
      phone: values.phone,
      email: values.email,
      pan: values.pan,
      address: values.address ?? "",
      city: values.city,
      source: values.source,
      assignedToId: values.assignedToId,
    };
    if (customer) {
      update.mutate({ id: customer.id, data: payload });
    } else {
      create.mutate({ ...payload, leadId: null });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
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
                      <Input placeholder="Priya Sharma" {...field} />
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
                      <Input placeholder="priya@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN</FormLabel>
                    <FormControl>
                      <Input placeholder="ABCDE1234F" className="uppercase" {...field} />
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
                      <Input placeholder="Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street, area" {...field} />
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : customer ? "Save changes" : "Add customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
