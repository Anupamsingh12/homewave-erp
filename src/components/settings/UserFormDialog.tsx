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
import { userService } from "@/services";
import { titleize } from "@/lib/format";
import type { User, UserRole } from "@/types";

const ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SALES_MANAGER",
  "SALES_EXECUTIVE",
  "ACCOUNTS",
  "PROJECT_MANAGER",
];

const userSchema = z.object({
  name: z.string().trim().min(2, "Enter a full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  role: z.enum(ROLES as [UserRole, ...UserRole[]]),
});

type UserFormValues = z.infer<typeof userSchema>;

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user?: User | undefined;
  onSaved?: (user: User) => void;
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", phone: "", role: "SALES_EXECUTIVE" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      user
        ? { name: user.name, email: user.email, phone: user.phone, role: user.role }
        : { name: "", email: "", phone: "", role: "SALES_EXECUTIVE" },
    );
  }, [open, user, form]);

  const create = useAction(userService.create, {
    success: "User added",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<User> }) => userService.update(input.id, input.data),
    {
      success: "User updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: UserFormValues) {
    if (user) {
      update.mutate({ id: user.id, data: values });
    } else {
      create.mutate({ ...values, active: true });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "Add user"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {titleize(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : user ? "Save changes" : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
