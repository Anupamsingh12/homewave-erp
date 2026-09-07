import { Panel } from "@/components/shared/DetailCard";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import type { Activity } from "@/types";

export function RecentActivityFeed({ items }: { items: Activity[] }) {
  return (
    <Panel title="Recent Activity" description="What's happened across the workspace.">
      <ActivityTimeline items={items} />
    </Panel>
  );
}
