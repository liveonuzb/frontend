import { map } from "lodash";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { CHART_COLORS } from "@/lib/chart-colors"

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-popover text-popover-foreground shadow-md rounded-lg border p-2 text-xs">
      <p className="font-medium mb-1">{label}</p>
      {map(payload, (entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function RechartsBar({
  data,
  dataKey,
  xAxisKey = "name",
  color = CHART_COLORS[0],
  height = 200,
  showGrid = false,
  showTooltip = true,
  barRadius = [4, 4, 0, 0],
  gradientColor,
}) {
  const gradientId = `bar-gradient-${dataKey}`
  const fillColor = gradientColor ? `url(#${gradientId})` : color

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        {gradientColor && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
        )}

        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}

        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />

        <YAxis hide />

        {showTooltip && <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />}

        <Bar dataKey={dataKey} fill={fillColor} radius={barRadius} />
      </BarChart>
    </ResponsiveContainer>
  )
}
