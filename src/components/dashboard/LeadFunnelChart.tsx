import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Panel } from "@/components/shared/DetailCard";
import { titleize, formatNumber } from "@/lib/format";
import type { DashboardSnapshot } from "@/services/analytics.service";

export function LeadFunnelChart({ data }: { data: DashboardSnapshot["leadFunnel"] }) {
  const rows = data
    .filter((d) => d.stage !== "LOST")
    .map((d) => ({ stage: titleize(d.stage), count: d.count }));

  return (
    <Panel title="Lead Funnel" description="Where leads stand across the pipeline right now.">
      <ChartContainer
        config={{ count: { label: "Leads", color: "var(--chart-1)" } }}
        className="aspect-auto h-72 w-full"
      >
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="stage"
            width={90}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={<ChartTooltipContent formatter={(value) => formatNumber(Number(value))} />}
          />
          <Bar dataKey="count" fill="var(--chart-1)" radius={4} barSize={18}>
            <LabelList
              dataKey="count"
              position="right"
              className="fill-foreground text-xs font-medium"
              formatter={(value: number) => formatNumber(value)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </Panel>
  );
}
