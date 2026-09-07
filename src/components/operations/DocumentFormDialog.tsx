import { useEffect, useMemo, useState } from "react";
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
import { documentService } from "@/services";
import { titleize } from "@/lib/format";
import type { DocumentRecord, DocumentType, EntityKind } from "@/types";

const DOC_TYPES: DocumentType[] = [
  "PAN",
  "AADHAAR",
  "KYC",
  "AGREEMENT",
  "BOOKING_FORM",
  "DEMAND_LETTER",
  "INVOICE",
  "PAYMENT_RECEIPT",
  "POSSESSION_LETTER",
  "OTHER",
];

const ENTITY_KINDS: EntityKind[] = [
  "LEAD",
  "CUSTOMER",
  "PROJECT",
  "UNIT",
  "BOOKING",
  "AGREEMENT",
  "INVOICE",
  "PAYMENT",
];

const uploadSchema = z.object({
  name: z.string().trim().min(1, "Choose a file to upload"),
  type: z.enum(DOC_TYPES as [DocumentType, ...DocumentType[]]),
  entityKind: z.enum(ENTITY_KINDS as [EntityKind, ...EntityKind[]]),
  entityId: z.string().min(1, "Select the record this document belongs to"),
  sizeKb: z.coerce.number().min(1),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function DocumentFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (doc: DocumentRecord) => void;
}) {
  const { customers, projects, units, leads, users } = useLookups();
  const [fileError, setFileError] = useState("");

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { name: "", type: "OTHER", entityKind: "CUSTOMER", entityId: "", sizeKb: 0 },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: "", type: "OTHER", entityKind: "CUSTOMER", entityId: "", sizeKb: 0 });
      setFileError("");
    }
  }, [open, form]);

  const entityKind = form.watch("entityKind");
  const entityOptions = useMemo(() => {
    switch (entityKind) {
      case "CUSTOMER":
        return customers.map((c) => ({ id: c.id, label: c.name }));
      case "PROJECT":
        return projects.map((p) => ({ id: p.id, label: p.name }));
      case "UNIT":
        return units.map((u) => ({ id: u.id, label: u.code }));
      case "LEAD":
        return leads.map((l) => ({ id: l.id, label: l.name }));
      default:
        return [];
    }
  }, [entityKind, customers, projects, units, leads]);

  const create = useAction(documentService.create, {
    success: "Document uploaded",
    onDone: (result) => {
      onOpenChange(false);
      onSaved?.(result);
    },
  });

  function onSubmit(values: UploadFormValues) {
    create.mutate({
      name: values.name,
      type: values.type,
      entityKind: values.entityKind,
      entityId: values.entityId,
      uploadedById: users[0]?.id ?? "",
      sizeKb: values.sizeKb,
      status: "PENDING",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm leading-none font-medium">File</label>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    form.setValue("name", file.name);
                    form.setValue("sizeKb", Math.max(1, Math.round(file.size / 1024)));
                    setFileError("");
                  }
                }}
              />
              {form.watch("name") && (
                <p className="text-xs text-muted-foreground">
                  {form.watch("name")} · {form.watch("sizeKb")} KB
                </p>
              )}
              {fileError && <p className="text-xs font-medium text-destructive">{fileError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOC_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {titleize(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entityKind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Belongs to</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("entityId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ENTITY_KINDS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {titleize(k)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="entityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Record</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a record" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entityOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
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
              <Button
                type="submit"
                disabled={create.isPending}
                onClick={() => {
                  if (!form.getValues("name")) setFileError("Choose a file to upload");
                }}
              >
                {create.isPending ? "Uploading…" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
