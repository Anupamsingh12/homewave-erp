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
import { towerService } from "@/services";
import { titleize } from "@/lib/format";
import type { ProjectStatus, Tower } from "@/types";

const STATUSES: ProjectStatus[] = ["PLANNING", "ACTIVE", "ON_TRACK", "DELAYED", "COMPLETED"];

const towerSchema = z.object({
  name: z.string().trim().min(1, "Enter a tower name"),
  floors: z.coerce.number().int().min(1, "Must have at least 1 floor"),
  unitsPerFloor: z.coerce.number().int().min(1, "Must have at least 1 unit per floor"),
  status: z.enum(STATUSES as [ProjectStatus, ...ProjectStatus[]]),
});

type TowerFormValues = z.infer<typeof towerSchema>;

export function TowerFormDialog({
  open,
  onOpenChange,
  projectId,
  tower,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  tower?: Tower | undefined;
  onSaved?: (tower: Tower) => void;
}) {
  const form = useForm<TowerFormValues>({
    resolver: zodResolver(towerSchema),
    defaultValues: { name: "", floors: 10, unitsPerFloor: 4, status: "PLANNING" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      tower
        ? {
            name: tower.name,
            floors: tower.floors,
            unitsPerFloor: tower.unitsPerFloor,
            status: tower.status,
          }
        : { name: "", floors: 10, unitsPerFloor: 4, status: "PLANNING" },
    );
  }, [open, tower, form]);

  const create = useAction(towerService.create, {
    success: "Tower added",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<Tower> }) => towerService.update(input.id, input.data),
    {
      success: "Tower updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: TowerFormValues) {
    const payload: Partial<Tower> = {
      name: values.name,
      floors: values.floors,
      unitsPerFloor: values.unitsPerFloor,
      status: values.status,
    };
    if (tower) {
      update.mutate({ id: tower.id, data: payload });
    } else {
      create.mutate({ ...payload, projectId });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tower ? "Edit tower" : "Add tower"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tower name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tower A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="floors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floors</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitsPerFloor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Units / floor</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {titleize(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : tower ? "Save changes" : "Add tower"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
