interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
  formatValue: (value: number) => string;
}

// Recharts' default Tooltip renders a plain white box regardless of theme —
// this matches the app's own card styling instead.
export function ChartTooltip({ active, label, payload, formatValue }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-label figure">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="chart-tooltip-row">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="figure">{formatValue(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  );
}
