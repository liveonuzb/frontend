import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUpIcon, ScaleIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart.jsx";
import { get, min, max, map, find } from "lodash";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  weight: {
    label: "Vazn",
    color: "hsl(var(--primary))",
    background: "hsl(var(--background))",
  },
  target: {
    label: "Maqsad",
    color: "hsl(var(--muted-foreground))",
  },
};

const CustomTooltip = ({ active, payload, label, targetW }) => {
  if (!active || !get(payload, "length")) return null;

  const weightPayload = find(payload, (p) => get(p, "dataKey") === "weight");
  const currentWeight = get(weightPayload, "value", 0);

  const dateStr = new Date(label).toLocaleDateString("uz-UZ", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl px-4 py-3 shadow-xl shadow-primary/20 text-xs min-w-[140px]">
      <p className="text-muted-foreground/80 mb-2 font-medium border-b border-border/50 pb-1.5">
        {dateStr}
      </p>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-primary" />
            <span className="font-medium text-muted-foreground">Vazn</span>
          </div>
          <p className="font-black text-sm text-foreground">
            {Number(currentWeight).toFixed(1)}{" "}
            <span className="text-[10px] text-muted-foreground font-semibold">
              kg
            </span>
          </p>
        </div>

        {targetW > 0 && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-muted-foreground">
                  Maqsad
                </span>
              </div>
              <p className="font-black text-sm text-foreground">
                {Number(targetW).toFixed(1)}{" "}
                <span className="text-[10px] text-muted-foreground font-semibold">
                  kg
                </span>
              </p>
            </div>

            <div className="mt-1 pt-1.5 border-t border-dashed border-border/60 flex items-center justify-between gap-2">
              <span className="font-semibold text-muted-foreground text-[10px] uppercase">
                Qoldi
              </span>
              <p className="font-black text-sm text-orange-500">
                {Math.abs(currentWeight - targetW).toFixed(1)}{" "}
                <span className="text-[10px] font-semibold">kg</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const WeightHistoryChart = ({
  chartData,
  chartPeriod,
  setChartPeriod,
  targetW,
}) => {
  const weights = map(chartData, "weight");

  const allValuesForBounds = targetW > 0 ? [...weights, targetW] : weights;
  const historyLen = get(allValuesForBounds, "length", 0);
  const overallMin = historyLen ? min(allValuesForBounds) : 0;
  const overallMax = historyLen ? max(allValuesForBounds) : 0;

  const yDomainMin = Math.max(0, overallMin - 2);
  const yDomainMax = overallMax + 2;

  const enhancedData = map(chartData, (item) => ({
    ...item,
    target: targetW > 0 ? targetW : undefined,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className={"py-6"}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 relative z-10 px-5 pb-4 pt-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-inner">
              <TrendingUpIcon className="size-4 text-white" />
            </div>
            Vazn tarixi
          </CardTitle>
          <Tabs
            value={chartPeriod}
            onValueChange={setChartPeriod}
            className="h-8"
          >
            <TabsList>
              <TabsTrigger value="day" className={"px-3"}>
                7D
              </TabsTrigger>
              <TabsTrigger value="week" className={"px-3"}>
                2W
              </TabsTrigger>
              <TabsTrigger value="month" className={"px-3"}>
                1M
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="relative pb-0">
          {get(enhancedData, "length", 0) >= 2 ? (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[240px] w-full relative z-10"
            >
              <AreaChart
                data={enhancedData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-orange-500)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="lineGradColored"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="var(--color-orange-500)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.15}
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={20}
                  tick={{
                    fontSize: 10,
                    fontWeight: 600,
                    fill: "hsl(var(--muted-foreground) / 0.8)",
                  }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fontWeight: 600,
                    fill: "hsl(var(--muted-foreground) / 0.8)",
                  }}
                  domain={[yDomainMin, yDomainMax]}
                  dx={-10}
                />

                <ChartTooltip
                  cursor={{
                    stroke: "hsl(var(--primary) / 0.3)",
                    strokeWidth: 2,
                    strokeDasharray: "4 4",
                  }}
                  content={<CustomTooltip targetW={targetW} />}
                />

                {targetW > 0 && (
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="var(--color-emerald-500)"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    fill="transparent"
                    isAnimationActive={false}
                    dot={false}
                    activeDot={false}
                  />
                )}

                {/* Main weight area */}
                <Area
                  type="monotone"
                  dataKey="weight"
                  fill="url(#fillWeight)"
                  stroke="url(#lineGradColored)"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "hsl(var(--background))",
                    strokeWidth: 2.5,
                    stroke: "hsl(var(--primary))",
                  }}
                  activeDot={{
                    r: 7,
                    fill: "var(--color-orange-500)",
                    strokeWidth: 3,
                    stroke: "hsl(var(--background))",
                  }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 bg-background/50 backdrop-blur-sm mx-5 mb-5 mt-2 rounded-2xl border border-dashed border-primary/20 relative z-10">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ScaleIcon className="size-6 text-primary/60" />
              </div>
              <p className="text-sm font-semibold text-foreground/80">
                Ma'lumotlar yetarli emas
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Grafikni ko'rish uchun kamida 2 ta vazn yozuvini kiriting
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
