import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthTrendPoint } from "../db/dashboard";
import { monthShortLabel } from "../lib/month";
import { theme } from "../lib/theme";
import { ChartTooltip } from "./ChartTooltip";

interface TrendChartProps {
  data: MonthTrendPoint[];
}

// Charting needs plain numbers, not display strings — this is local to chart
// data prep and distinct from the canonical fromMinorUnits/toMinorUnits pair
// used everywhere else for text formatting.
function toDisplayAmount(minor: number): number {
  return minor / 100;
}

const AXIS_TICK = { fill: theme.textMuted, fontSize: 12, fontFamily: "JetBrains Mono, monospace" };

export function TrendChart({ data }: TrendChartProps) {
  const chartData = data.map((p) => ({
    month: monthShortLabel(p.month),
    Income: toDisplayAmount(p.income),
    Expense: toDisplayAmount(p.expense),
    Available: toDisplayAmount(p.available),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={{ stroke: theme.border }} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={{ stroke: theme.border }} tickLine={false} />
        <Tooltip content={(props: any) => <ChartTooltip {...props} formatValue={(v) => v.toFixed(2)} />} />
        <Legend wrapperStyle={{ color: theme.textMuted, fontSize: "0.8rem", fontFamily: "Inter, sans-serif" }} />
        <Bar dataKey="Income" fill={theme.sage} barSize={18} />
        <Bar dataKey="Expense" fill={theme.terracotta} barSize={18} />
        <Line dataKey="Available" stroke={theme.amber} strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
