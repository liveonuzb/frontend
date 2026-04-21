import React from "react";
import { filter, map, size } from "lodash";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart.jsx";
import EarningsSectionCard from "./EarningsSectionCard.jsx";
import { formatMoney } from "./earnings-utils.js";

const revenueChartConfig = {
  revenue: { label: "Daromad", color: "hsl(var(--primary))" },
};

const statusChartConfig = {
  value: { label: "Soni", color: "hsl(var(--primary))" },
};

const EmptyChart = ({ text }) => (
  <div className="flex h-[180px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
    {text}
  </div>
);

export const EarningsTrendCharts = ({
  currentMonthDailyRevenue = [],
  monthlyRevenueTrend = [],
  statusDistribution = [],
}) => (
  <>
    <EarningsSectionCard
      title="Joriy oy kunlik daromad"
      description={`${new Intl.DateTimeFormat("uz-UZ", {
        month: "long",
        year: "numeric",
      }).format(new Date())} bo'yicha kunlik tushum.`}
    >
      {size(filter(currentMonthDailyRevenue, (item) => item.revenue > 0)) > 0 ? (
        <ChartContainer
          config={revenueChartConfig}
          className="aspect-auto h-[200px] w-full"
        >
          <BarChart
            data={currentMonthDailyRevenue}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="hsl(var(--muted-foreground) / 0.1)"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
              interval={4}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) =>
                value > 0 ? `${Math.round(value / 1000)}k` : "0"
              }
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => formatMoney(value)} />}
            />
            <Bar
              dataKey="revenue"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <EmptyChart text="Bu oy uchun daromad yozuvlari yo'q" />
      )}
    </EarningsSectionCard>

    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <EarningsSectionCard
        title="Oylik daromad trendi"
        description="Oxirgi oylar bo'yicha daromad oqimini ko'ring."
      >
        {size(monthlyRevenueTrend) ? (
          <ChartContainer
            config={revenueChartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              data={monthlyRevenueTrend}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="earningsRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} width={28} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                fill="url(#earningsRevenue)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <EmptyChart text="Trend uchun yetarli to'lov yo'q" />
        )}
      </EarningsSectionCard>

      <EarningsSectionCard
        title="To'lov holatlari"
        description="Barcha to'lovlarning status bo'yicha taqsimoti."
      >
        {size(statusDistribution) ? (
          <>
            <ChartContainer
              config={statusChartConfig}
              className="aspect-auto h-[200px] w-full"
            >
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {map(statusDistribution, (entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel indicator="dot" />}
                />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {map(statusDistribution, (item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyChart text="Statuslar bo'yicha ma'lumot yo'q" />
        )}
      </EarningsSectionCard>
    </div>
  </>
);

export default EarningsTrendCharts;
