import { map, first } from "lodash";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const { name, value } = first(payload)

  return (
    <div className="bg-popover text-popover-foreground shadow-md rounded-lg border p-2 text-xs">
      <p>
        <span className="font-medium">{name}:</span> {value}
      </p>
    </div>
  )
}

export default function RechartsPie({
  data,
  height = 200,
  innerRadius = 60,
  outerRadius = 80,
  showTooltip = true,
  showLabel = false,
  centerLabel,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          nameKey="name"
          label={showLabel}
          labelLine={showLabel}
        >
          {map(data, (entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>

        {showTooltip && <Tooltip content={<CustomTooltip />} />}

        {centerLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground text-sm font-medium"
          >
            {centerLabel}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}
