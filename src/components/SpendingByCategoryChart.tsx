import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategorySpending } from "../db/dashboard";
import { fromMinorUnits } from "../lib/money";
import { getCategoryColor, theme } from "../lib/theme";
import { ChartTooltip } from "./ChartTooltip";
import { CategoryIcon } from "./CategoryIcon";

interface SpendingByCategoryChartProps {
  data: CategorySpending[];
}

export function SpendingByCategoryChart({ data }: SpendingByCategoryChartProps) {
  if (data.length === 0) {
    return <p className="empty-state">No expenses recorded this month.</p>;
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="spent" nameKey="category_name" cx="50%" cy="50%" outerRadius={90}>
            {data.map((entry) => (
              <Cell
                key={entry.category_id}
                fill={getCategoryColor({ id: entry.category_id, color: entry.color })}
                stroke={theme.bg}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={(props: any) => <ChartTooltip {...props} formatValue={fromMinorUnits} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend (not recharts' Legend) so each entry can show the
          category's actual icon, not just a color swatch. */}
      <ul className="chart-legend">
        {data.map((entry) => (
          <li key={entry.category_id} className="chart-legend-item">
            <CategoryIcon category={{ id: entry.category_id, color: entry.color, icon: entry.icon }} size={14} />
            <span>{entry.category_name}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
