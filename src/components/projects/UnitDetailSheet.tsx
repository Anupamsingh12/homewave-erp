import { useNavigate } from "@tanstack/react-router";
import { Lock, Pencil, PlayCircle, ShoppingCart, Unlock } from "lucide-react";
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
import { unitService } from "@/services";
import { countdown, formatINR } from "@/lib/format";
import type { Unit } from "@/types";

export function UnitDetailSheet({
  unit,
  onOpenChange,
  onEdit,
  onHold,
  onBlock,
}: {
  unit: Unit | null;
  onOpenChange: (v: boolean) => void;
  onEdit: (unit: Unit) => void;
  onHold: (unit: Unit) => void;
  onBlock: (unit: Unit) => void;
}) {
  const lookups = useLookups();
  const navigate = useNavigate();
  const release = useAction(unitService.release, { success: "Hold released" });

  return (
    <Sheet open={Boolean(unit)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {unit && (
          <>
            <SheetHeader>
              <SheetTitle>{unit.code}</SheetTitle>
              <SheetDescription>
                {unit.bhk} BHK · {unit.carpetArea} sq.ft · {lookups.towerName(unit.towerId)},{" "}
                {lookups.projectName(unit.projectId)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-6 px-4">
              <div className="flex items-center gap-2">
                <StatusBadge value={unit.status} />
                {unit.status === "HOLD" && unit.holdUntil && (
                  <span className="text-xs text-muted-foreground">
                    Expires in {countdown(unit.holdUntil, new Date())}
                  </span>
                )}
              </div>

              <FieldList
                items={[
                  { label: "Floor", value: String(unit.floor) },
                  { label: "Facing", value: unit.facing },
                  { label: "Base Price", value: formatINR(unit.basePrice) },
                  { label: "PLC", value: formatINR(unit.plc) },
                  { label: "Parking", value: formatINR(unit.parking) },
                  { label: "Floor Rise", value: formatINR(unit.floorRise) },
                  { label: "Other Charges", value: formatINR(unit.otherCharges) },
                  {
                    label: "Total Agreement Value (incl. GST)",
                    value: formatINR(unitService.total(unit)),
                  },
                ]}
              />

              {unit.holdCustomerId && (
                <FieldList
                  items={[
                    { label: "Held For", value: lookups.customerName(unit.holdCustomerId) },
                    { label: "Reason", value: unit.holdReason || "—" },
                  ]}
                />
              )}

              <div className="flex flex-wrap gap-2">
                {unit.status === "AVAILABLE" && (
                  <>
                    <Button variant="outline" onClick={() => onHold(unit)}>
                      <Lock className="size-4" /> Hold Unit
                    </Button>
                    <Button onClick={() => navigate({ to: "/bookings" })}>
                      <ShoppingCart className="size-4" /> Book Unit
                    </Button>
                  </>
                )}
                {unit.status === "HOLD" && (
                  <>
                    <Button variant="outline" onClick={() => release.mutate(unit.id)}>
                      <PlayCircle className="size-4" /> Release Hold
                    </Button>
                    <Button onClick={() => navigate({ to: "/bookings" })}>
                      <ShoppingCart className="size-4" /> Book Unit
                    </Button>
                  </>
                )}
                {(unit.status === "AVAILABLE" || unit.status === "BLOCKED") && (
                  <Button variant="outline" onClick={() => onBlock(unit)}>
                    {unit.status === "BLOCKED" ? (
                      <>
                        <Unlock className="size-4" /> Unblock
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" /> Block
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={() => onEdit(unit)}>
                  <Pencil className="size-4" /> Edit
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
