import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DocumentFormDialog } from "@/components/operations/DocumentFormDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { useLookups } from "@/hooks/use-lookups";
import { bookingService, documentService } from "@/services";
import { formatDate, titleize } from "@/lib/format";
import type { DocumentRecord, DocumentType } from "@/types";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
});

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

function downloadMetadata(doc: DocumentRecord, entityLabel: string) {
  const body = [
    `Name: ${doc.name}`,
    `Type: ${doc.type}`,
    `Belongs to: ${doc.entityKind} — ${entityLabel}`,
    `Status: ${doc.status}`,
    `Uploaded: ${doc.createdAt}`,
    `Size: ${doc.sizeKb} KB`,
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.name.replace(/\.[^.]+$/, "")}-details.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function DocumentsPage() {
  const lookups = useLookups();
  const { data: documents, isLoading } = useData(["documents", "all"], documentService.all);
  const { data: bookings } = useData(["bookings", "all"], bookingService.all);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<DocumentRecord | null>(null);

  const remove = useAction(documentService.remove, { success: "Document deleted" });
  const setStatus = useAction(
    (input: { id: string; status: DocumentRecord["status"] }) =>
      documentService.update(input.id, { status: input.status }),
    { success: "Document status updated" },
  );

  function entityLabel(doc: DocumentRecord): string {
    switch (doc.entityKind) {
      case "CUSTOMER":
        return lookups.customerName(doc.entityId);
      case "PROJECT":
        return lookups.projectName(doc.entityId);
      case "LEAD":
        return lookups.leadName(doc.entityId);
      case "UNIT":
        return lookups.unitCode(doc.entityId);
      case "BOOKING":
        return (bookings ?? []).find((b) => b.id === doc.entityId)?.code ?? doc.entityId;
      default:
        return doc.entityId;
    }
  }

  const columns: Column<DocumentRecord>[] = [
    { key: "name", header: "Name" },
    { key: "type", header: "Type", render: (d) => titleize(d.type) },
    {
      key: "entityKind",
      header: "Entity",
      render: (d) => `${titleize(d.entityKind)} — ${entityLabel(d)}`,
    },
    {
      key: "uploadedById",
      header: "Uploaded By",
      value: (d) => lookups.userName(d.uploadedById),
      render: (d) => lookups.userName(d.uploadedById),
    },
    {
      key: "createdAt",
      header: "Uploaded Date",
      value: (d) => d.createdAt,
      render: (d) => formatDate(d.createdAt),
    },
    { key: "status", header: "Status", render: (d) => <StatusBadge value={d.status} /> },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (d) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Document actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => downloadMetadata(d, entityLabel(d))}>
              <Download className="size-4" /> Download
            </DropdownMenuItem>
            {d.status === "PENDING" && (
              <>
                <DropdownMenuItem
                  onClick={() => setStatus.mutate({ id: d.id, status: "VERIFIED" })}
                >
                  Mark Verified
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatus.mutate({ id: d.id, status: "REJECTED" })}
                >
                  Mark Rejected
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setDeleting(d)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<DocumentRecord>[] = [
    { key: "type", label: "Type", options: DOC_TYPES, match: (d, v) => d.type === v },
    {
      key: "status",
      label: "Status",
      options: ["PENDING", "VERIFIED", "REJECTED"],
      match: (d, v) => d.status === v,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Every file attached to a lead, customer, project, or booking."
        actions={
          <Button onClick={() => setUploading(true)}>
            <Plus className="size-4" /> Upload Document
          </Button>
        }
      />
      <DataTable
        rows={documents ?? []}
        columns={columns}
        loading={isLoading || lookups.loading}
        searchFields={["name"]}
        filters={filters}
        exportName="documents"
        emptyTitle="No documents yet"
        emptyDescription="Upload KYC, agreements, and receipts to keep everything in one place."
      />

      <DocumentFormDialog open={uploading} onOpenChange={setUploading} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete document?"
        description={`This will permanently remove "${deleting?.name ?? "this document"}". This action cannot be undone.`}
        confirmLabel="Delete Document"
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
