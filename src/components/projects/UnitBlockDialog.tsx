import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-erp";
import { unitService } from "@/services";
import type { Unit } from "@/types";

export function UnitBlockDialog({
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
  const [reason, setReason] = useState("");
  const block = useAction(
    (input: { id: string; reason: string }) => unitService.block(input.id, input.reason),
    {
      success: unit?.status === "BLOCKED" ? "Unit unblocked" : "Unit blocked",
      onDone: (result) => {
        onOpenChange(false);
        setReason("");
        onSaved?.(result);
      },
    },
  );

  const willUnblock = unit?.status === "BLOCKED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{willUnblock ? `Unblock ${unit?.code}` : `Block ${unit?.code}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="block-reason">Reason</Label>
          <Input
            id="block-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={willUnblock ? "Reason for releasing this unit" : "e.g. Under legal review"}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={block.isPending || !unit}
            onClick={() => unit && block.mutate({ id: unit.id, reason })}
          >
            {block.isPending ? "Saving…" : willUnblock ? "Unblock Unit" : "Block Unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
