import { map } from "lodash";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
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

export default function RechartsLine({
  data,
  dataKey,
  xAxisKey = "name",
  color = CHART_COLORS[0],
  height = 200,
  showGrid = false,
  showTooltip = true,
  showArea = true,
  strokeWidth = 2,
  dot = true,
}) {
  const gradientId = `line-gradient-${dataKey}`

  const xAxisProps = {
    dataKey: xAxisKey,
    tick: { fontSize: 12, fill: "var(--color-muted-foreground)" },
    tickLine: false,
    axisLine: false,
  }

  const tooltipElement = showTooltip ? (
    <Tooltip content={<CustomTooltip />} />
  ) : null

  const gridElement = showGrid ? (
    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
  ) : null

  if (showArea) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {gridElement}
          <XAxis {...xAxisProps} />
          {tooltipElement}

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={`url(#${gradientId})`}
            dot={dot}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {gridElement}
        <XAxis {...xAxisProps} />
        {tooltipElement}

        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={strokeWidth}
          dot={dot}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
