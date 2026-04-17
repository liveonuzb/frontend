import React from "react";
import { clamp, round, times } from "lodash";
import { motion } from "framer-motion";
import { FlameIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { cn } from "@/lib/utils";

export default function CalorieGaugeWidget({
  consumed = 0,
  goal = 2200,
  macros = {
    protein: { current: 0, target: 150 },
    carbs: { current: 0, target: 250 },
    fat: { current: 0, target: 70 },
  },
  onClick,
  className,
  isGoalLoading = false,
  goalMeta = null,
}) {
  const isOver = consumed > goal;
  const excess = consumed - goal;
  const remaining = clamp(goal - consumed, 0, Infinity);
  const pct = clamp(consumed / goal, 0, 1);

  const vw = 280;
  const vh = 155;
  const cx = vw / 2;
  const cy = 135;
  const radius = 105;
  const strokeW = 13;

  // Arc from 180° to 0° (left to right, upper half)
  const startAngle = 180;
  const totalSweep = 180;

  const polarToCartesian = (angle) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const arcPath = (fromAngle, toAngle) => {
    const start = polarToCartesian(fromAngle);
    const end = polarToCartesian(toAngle);
    const largeArc = Math.abs(fromAngle - toAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const bgArc = arcPath(startAngle, 0);
  const filledAngle = startAngle - pct * totalSweep;
  const filledArc = arcPath(startAngle, Math.max(filledAngle, 0));
  const knobPos = polarToCartesian(filledAngle);

  const tickCount = 30;
  const ticks = times(tickCount + 1, (i) => {
    const angle = startAngle - (i / tickCount) * totalSweep;
    const innerR = radius - strokeW / 2 - 4;
    const outerR = radius - strokeW / 2 - (i % 5 === 0 ? 13 : 8);
    const rad = (angle * Math.PI) / 180;
    return {
      x1: cx + innerR * Math.cos(rad),
      y1: cy - innerR * Math.sin(rad),
      x2: cx + outerR * Math.cos(rad),
      y2: cy - outerR * Math.sin(rad),
      major: i % 5 === 0,
      filled: angle >= filledAngle,
    };
  });

  const macroItems = [
    {
      label: "Oqsil",
      current: round(macros.protein?.current || 0),
      target: macros.protein?.target || 150,
      emoji: "🍗",
      color: "#ef4444",
    },
    {
      label: "Uglevod",
      current: round(macros.carbs?.current || 0),
      target: macros.carbs?.target || 250,
      emoji: "🍴",
      color: "#f59e0b",
    },
    {
      label: "Yog'",
      current: round(macros.fat?.current || 0),
      target: macros.fat?.target || 70,
      emoji: "🥑",
      color: "#22c55e",
    },
  ];

  return (
    <Card
      className={cn(
        "backdrop-blur-2xl relative overflow-hidden h-full py-6",
        onClick ? "cursor-pointer" : null,
        className,
      )}
      onClick={onClick}
    >
      <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
      <CardHeader className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-base font-bold">
            Bugungi Kaloriya <span className="text-lg">🔥</span>
          </h3>
        </div>
        <div className="text-right">
          <span
            className={cn(
              "text-sm font-semibold text-muted-foreground",
              isGoalLoading && "animate-pulse",
            )}
          >
            {goal.toLocaleString()} kcal
          </span>
          {isGoalLoading ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Maqsad profilingizga moslanmoqda
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center flex-1 items-center">
          <svg
            viewBox={`0 0 ${vw} ${vh}`}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 160,
              overflow: "visible",
            }}
            preserveAspectRatio="xMidYMid meet"
            overflow="visible"
          >
            <defs>
              <linearGradient
                id="gaugeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                {isOver ? (
                  <>
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#a3e635" />
                    <stop offset="50%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#65a30d" />
                  </>
                )}
              </linearGradient>
              <filter
                id="knobShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="1"
                  stdDeviation="3"
                  floodColor="#000"
                  floodOpacity="0.25"
                />
              </filter>
              <filter id="arcGlow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="5"
                  floodColor={isOver ? "#ef4444" : "#84cc16"}
                  floodOpacity="0.55"
                />
              </filter>
            </defs>

            {/* Background arc */}
            <path
              d={bgArc}
              fill="none"
              stroke="currentColor"
              className="text-muted/40"
              strokeWidth={strokeW}
              strokeLinecap="round"
            />

            {/* Filled arc with glow */}
            <motion.path
              d={filledArc}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeW}
              strokeLinecap="round"
              filter={pct > 0.01 ? "url(#arcGlow)" : undefined}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />

            {/* Tick marks */}
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="currentColor"
                className={
                  t.filled
                    ? isOver
                      ? "text-red-500/50"
                      : "text-lime-500/50"
                    : "text-muted-foreground/20"
                }
                strokeWidth={t.major ? 1.5 : 0.8}
              />
            ))}

            {/* Knob */}
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", bounce: 0.4 }}
            >
              <circle
                cx={knobPos.x}
                cy={knobPos.y}
                r={8}
                fill={isOver ? "#ef4444" : "#84cc16"}
                stroke="white"
                strokeWidth={3}
                filter="url(#knobShadow)"
              />
            </motion.g>

            {/* Center text */}
            <FlameIcon
              x={cx - 10}
              y={cy - 58}
              width={20}
              height={20}
              className={isOver ? "text-red-500" : "text-foreground/60"}
            />
            <text
              x={cx}
              y={cy - 26}
              textAnchor="middle"
              style={{
                fill: isOver
                  ? "#ef4444"
                  : "var(--color-muted-foreground, #888)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {isOver ? "Oshdi" : "Qolgan"}
            </text>
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              style={{
                fill: isOver ? "#ef4444" : "currentColor",
                fontSize: 34,
                fontWeight: 900,
              }}
            >
              {isOver
                ? `+${excess.toLocaleString()}`
                : remaining.toLocaleString()}
            </text>
            <text
              x={cx}
              y={cy + 26}
              textAnchor="middle"
              style={{
                fill: isOver
                  ? "#f87171"
                  : "var(--color-muted-foreground, #888)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              kcal
            </text>
          </svg>
        </div>
        <Separator className={"mt-14 mb-6"} />
        <div className="flex justify-around items-center">
          {macroItems.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{m.emoji}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {m.label}
                </span>
              </div>
              <div className="text-sm font-bold">
                <span style={{ color: m.color }}>{m.current}</span>
                <span className="text-muted-foreground font-normal text-xs">
                  /{m.target}g
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
