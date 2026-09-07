import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Panel } from "@/components/shared/DetailCard";
import { formatINR } from "@/lib/format";
import type { DashboardSnapshot } from "@/services/analytics.service";

const chartConfig = {
  value: { label: "Sales Value", color: "var(--chart-1)" },
  collected: { label: "Collections", color: "var(--chart-2)" },
};

export function SalesTrendChart({ data }: { data: DashboardSnapshot["salesTrend"] }) {
  return (
    <Panel
      title="Sales & Collection Trend"
      description="Last 8 months, booked value vs. cash collected."
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <LineChart data={data} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(v) => formatINR(Number(v), { compact: true })}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">
                      {name === "value" ? "Sales Value" : "Collections"}
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatINR(Number(value), { compact: true })}
                    </span>
                  </span>
                )}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="collected"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </LineChart>
      </ChartContainer>
    </Panel>
  );
}
