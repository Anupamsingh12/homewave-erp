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

const FACINGS = [
  "East",
  "West",
  "North",
  "South",
  "North-East",
  "South-East",
  "North-West",
  "South-West",
  "Garden",
];

const unitSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  towerId: z.string().min(1, "Select a tower"),
  floor: z.coerce.number().int().min(0, "Enter a valid floor number"),
  bhk: z.coerce.number().int().min(1, "Enter BHK count"),
  carpetArea: z.coerce.number().positive("Enter a carpet area"),
  facing: z.string().min(1, "Select a facing"),
  basePrice: z.coerce.number().positive("Enter a base price"),
  plc: z.coerce.number().min(0, "Cannot be negative"),
  parking: z.coerce.number().min(0, "Cannot be negative"),
  floorRise: z.coerce.number().min(0, "Cannot be negative"),
  otherCharges: z.coerce.number().min(0, "Cannot be negative"),
});

type UnitFormValues = z.infer<typeof unitSchema>;

function emptyValues(projectId: string): UnitFormValues {
  return {
    projectId,
    towerId: "",
    floor: 1,
    bhk: 2,
    carpetArea: 1000,
    facing: "East",
    basePrice: 0,
    plc: 0,
    parking: 350000,
    floorRise: 0,
    otherCharges: 175000,
  };
}

export function UnitFormDialog({
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
  const { projects, towers } = useLookups();
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: emptyValues(""),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      unit
        ? {
            projectId: unit.projectId,
            towerId: unit.towerId,
            floor: unit.floor,
            bhk: unit.bhk,
            carpetArea: unit.carpetArea,
            facing: unit.facing,
            basePrice: unit.basePrice,
            plc: unit.plc,
            parking: unit.parking,
            floorRise: unit.floorRise,
            otherCharges: unit.otherCharges,
          }
        : emptyValues(projects[0]?.id ?? ""),
    );
  }, [open, unit, form, projects]);

  const projectId = form.watch("projectId");
  const towerOptions = useMemo(
    () => towers.filter((t) => t.projectId === projectId),
    [towers, projectId],
  );

  const create = useAction(unitService.create, {
    success: "Unit created",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });
  const update = useAction(
    (input: { id: string; data: Partial<Unit> }) => unitService.update(input.id, input.data),
    {
      success: "Unit updated",
      onDone: (result) => {
        onOpenChange(false);
        onSaved?.(result);
      },
    },
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: UnitFormValues) {
    const tower = towers.find((t) => t.id === values.towerId);
    const payload: Partial<Unit> = {
      projectId: values.projectId,
      towerId: values.towerId,
      floor: values.floor,
      bhk: values.bhk,
      carpetArea: values.carpetArea,
      facing: values.facing,
      basePrice: values.basePrice,
      plc: values.plc,
      parking: values.parking,
      floorRise: values.floorRise,
      otherCharges: values.otherCharges,
      code: `${tower ? tower.name.replace(/^Tower /, "") : "U"}-${values.floor}${String(values.bhk).padStart(2, "0")}`,
    };
    if (unit) {
      update.mutate({ id: unit.id, data: payload });
    } else {
      create.mutate({
        ...payload,
        status: "AVAILABLE",
        holdCustomerId: null,
        holdSalespersonId: null,
        holdUntil: null,
        holdReason: null,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{unit ? "Edit unit" : "Add unit"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("towerId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
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
                name="towerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tower</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tower" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {towerOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
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
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bhk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BHK</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carpetArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carpet area (sq.ft)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facing</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FACINGS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
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
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base price</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={10000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PLC</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parking</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floorRise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor rise</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="otherCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other charges</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
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
                {pending ? "Saving…" : unit ? "Save changes" : "Add unit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
