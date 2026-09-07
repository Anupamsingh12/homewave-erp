import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel, FieldList } from "@/components/shared/DetailCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { KpiCard } from "@/components/shared/KpiCard";
import { ChannelPartnerFormDialog } from "@/components/partners/ChannelPartnerFormDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "@/hooks/use-erp";
import {
  bookingService,
  channelPartnerService,
  commissionService,
  leadService,
  siteVisitService,
} from "@/services";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/partners/$id")({
  component: PartnerDetailPage,
});

function PartnerDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const {
    data: partner,
    isLoading,
    isError,
  } = useData(["channelPartners", id], () => channelPartnerService.getById(id));
  const { data: leads } = useData(["leads", "all"], leadService.all);
  const { data: siteVisits } = useData(["siteVisits", "all"], siteVisitService.all);
  const { data: bookings } = useData(["bookings", "all"], bookingService.all);
  const { data: commissions } = useData(["commissions", "all"], commissionService.all);

  const [editing, setEditing] = useState(false);

  if (isError) {
    return (
      <EmptyState
        title="Channel partner not found"
        description="This partner may have been removed, or the link is incorrect."
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/partners" })}>
            Back to Channel Partners
          </Button>
        }
      />
    );
  }

  if (isLoading || !partner) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const partnerLeads = (leads ?? []).filter((l) => l.channelPartnerId === id);
  const partnerVisits = (siteVisits ?? []).filter((v) =>
    partnerLeads.some((l) => l.id === v.leadId),
  );
  const partnerBookings = (bookings ?? []).filter((b) => b.channelPartnerId === id);
  const partnerCommissions = (commissions ?? []).filter((c) => c.channelPartnerId === id);

  const salesValue = partnerBookings.reduce((s, b) => s + b.agreementValue, 0);
  const commissionEarned = partnerCommissions.reduce((s, c) => s + c.amount, 0);
  const commissionPaid = partnerCommissions.reduce((s, c) => s + c.paidAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={partner.company}
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
        }
      >
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <StatusBadge value={partner.active ? "ACTIVE" : "INACTIVE"} />
          <span>{partner.contactPerson}</span>
          <span>{partner.city}</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Leads" value={String(partnerLeads.length)} />
        <KpiCard label="Site Visits" value={String(partnerVisits.length)} />
        <KpiCard label="Bookings" value={String(partnerBookings.length)} accent="success" />
        <KpiCard label="Sales Value" value={formatINR(salesValue, { compact: true })} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Commission Earned" value={formatINR(commissionEarned, { compact: true })} />
        <KpiCard
          label="Commission Paid"
          value={formatINR(commissionPaid, { compact: true })}
          accent="success"
        />
        <KpiCard
          label="Outstanding Commission"
          value={formatINR(commissionEarned - commissionPaid, { compact: true })}
          accent="warning"
        />
      </div>

      <Panel title="Profile">
        <FieldList
          items={[
            { label: "Phone", value: partner.phone },
            { label: "Email", value: partner.email },
            { label: "RERA Number", value: partner.reraNumber },
            { label: "Commission %", value: `${partner.commissionPct}%` },
          ]}
        />
      </Panel>

      <ChannelPartnerFormDialog open={editing} onOpenChange={setEditing} partner={partner} />
    </div>
  );
}
