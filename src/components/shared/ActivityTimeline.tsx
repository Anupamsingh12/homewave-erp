import { fromNow } from "@/lib/format";
import type { Activity } from "@/types";
import { EmptyState } from "./EmptyState";

export function ActivityTimeline({ items }: { items: Activity[] }) {
  if (!items.length) return <EmptyState title="No activity yet" description="Actions on this record will appear here." />;
  return (
    <ol className="relative space-y-5 pl-6">
      <span className="absolute top-1 bottom-1 left-[7px] w-px bg-border" aria-hidden />
      {items.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute top-1 -left-[22px] size-3.5 rounded-full border-2 border-card bg-primary" />
          <p className="text-sm font-medium text-foreground">{a.title}</p>
          <p className="text-sm text-muted-foreground">{a.description}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{fromNow(a.at)}</p>
        </li>
      ))}
    </ol>
  );
}
