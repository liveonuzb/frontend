import React from "react";
import { clamp, round, times, map } from "lodash";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronsUpDown, FlameIcon, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils";

const MacroCardGrid = ({ macroItems, isInteractive, onClick }) => {
  const handleKeyDown = React.useCallback(
    (event) => {
      if (!isInteractive || event.target !== event.currentTarget) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    [isInteractive, onClick],
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {map(macroItems, (macro) => {
        const pct = clamp(macro.current / macro.target, 0, 1);
        const ariaLabel = `${macro.label} ${macro.current} / ${macro.target}g`;
        return (
          <Card
            key={macro.key}
            size="sm"
            className={cn(
              "min-w-0 px-3 py-2 transition-all hover:ring-primary/20 hover:shadow-sm !gap-y-1.5",
            )}
            onClick={isInteractive ? onClick : undefined}
            onKeyDown={handleKeyDown}
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            aria-label={isInteractive ? ariaLabel : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-foreground/80">
                {macro.label}
              </p>
              <MoreHorizontal
                className="size-3.5 shrink-0 text-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="flex min-w-0 items-baseline gap-1 text-base font-black leading-none tracking-normal text-foreground">
              <span className="tabular-nums">{macro.current}</span>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                / {macro.target}g
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary/80">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: macro.color }}
                initial={false}
                animate={{ width: `${pct * 100}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
};

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
  showCalorieModeToggle = false,
  defaultCalorieMode = "remaining",
  calorieMode,
  onCalorieModeChange,
  labels = {},
  compact = false,
}) {
  const shouldReduceMotion = useReducedMotion();
  const resolvedLabels = {
    title: labels.title ?? "Bugungi Kaloriya",
    eaten: labels.eaten ?? "Yeyilgan",
    remaining: labels.remaining ?? "Qolgan",
    over: labels.over ?? "Oshdi",
    kcal: labels.kcal ?? "kcal",
    toggleAria: labels.toggleAria ?? "Kaloriya ko'rsatkichini almashtirish",
    goalLoading: labels.goalLoading ?? "Maqsad profilingizga moslanmoqda",
    protein: labels.protein ?? "Oqsil",
    carbs: labels.carbs ?? "Uglevod",
    fat: labels.fat ?? "Yog'",
    proteinLowAlert: labels.proteinLowAlert ?? "Oqsil kam",
    fatHighAlert: labels.fatHighAlert ?? "Yog' oshib ketdi",
    calorieCloseAlert: labels.calorieCloseAlert ?? "Maqsadga yaqin",
    ariaLabel: labels.ariaLabel,
  };
  const isOver = consumed > goal;
  const excess = consumed - goal;
  const remaining = clamp(goal - consumed, 0, Infinity);
  const pct = clamp(consumed / goal, 0, 1);
  const consumedLabel = round(consumed).toLocaleString();
  const goalLabel = round(goal).toLocaleString();
  const pctLabel = goal > 0 ? round((consumed / goal) * 100) : 0;
  const gaugeAriaLabel =
    resolvedLabels.ariaLabel ||
    `Bugun ${consumedLabel}/${goalLabel} kaloriya iste'mol qilindi (${pctLabel}%)`;
  const [internalCalorieMode, setInternalCalorieMode] = React.useState(
    defaultCalorieMode === "eaten" ? "eaten" : "remaining",
  );
  const resolvedCalorieMode =
    calorieMode === "eaten" || calorieMode === "remaining"
      ? calorieMode
      : internalCalorieMode;
  const isEatenMode = resolvedCalorieMode === "eaten";
  const centerIsOver = !isEatenMode && isOver;
  const centerLabel = isEatenMode
    ? resolvedLabels.eaten
    : isOver
      ? resolvedLabels.over
      : resolvedLabels.remaining;
  const centerValue = isEatenMode ? consumed : isOver ? excess : remaining;
  const centerValueLabel =
    !isEatenMode && isOver
      ? `+${round(centerValue).toLocaleString()}`
      : round(centerValue).toLocaleString();

  const toggleCalorieMode = (event) => {
    event.stopPropagation();
    const nextMode = isEatenMode ? "remaining" : "eaten";

    if (calorieMode !== "eaten" && calorieMode !== "remaining") {
      setInternalCalorieMode(nextMode);
    }

    onCalorieModeChange?.(nextMode);
  };
  const isInteractive = typeof onClick === "function";
  const handleCardKeyDown = React.useCallback(
    (event) => {
      if (!isInteractive || event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    [isInteractive, onClick],
  );

  const vw = 280;
  const vh = 155;
  const cx = vw / 2;
  const cy = 135;
  const radius = 105;
  const strokeW = 12;

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
      key: "carbs",
      label: resolvedLabels.carbs,
      current: round(macros.carbs?.current || 0),
      target: macros.carbs?.target || 250,
      emoji: "🍚",
      color: "#84cc16",
    },
    {
      key: "protein",
      label: resolvedLabels.protein,
      current: round(macros.protein?.current || 0),
      target: macros.protein?.target || 150,
      emoji: "🍗",
      color: "#f59e0b",
    },
    {
      key: "fat",
      label: resolvedLabels.fat,
      current: round(macros.fat?.current || 0),
      target: macros.fat?.target || 70,
      emoji: "🥑",
      color: "#a78bfa",
    },
  ];

  const gaugeCard = (
    <Card
      className={cn(
        "relative h-full overflow-hidden py-4 transition-all hover:ring-primary/20 hover:shadow-sm",
      )}
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? gaugeAriaLabel : undefined}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-primary/10 blur-[28px]" />
      <CardHeader className="relative z-10 px-4">
        <div className="flex w-full items-center justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
            <span className="rounded bg-primary/10 p-1 text-primary">
              <FlameIcon className="size-3" />
            </span>
            <span className="truncate">{resolvedLabels.title}</span>
          </CardTitle>
          {showCalorieModeToggle ? (
            <Button
              type="button"
              variant={"outline"}
              size="sm"
              className="h-8 shrink-0 rounded-full text-xs font-bold"
              onClick={toggleCalorieMode}
              aria-label={resolvedLabels.toggleAria}
            >
              <span>
                {isEatenMode ? resolvedLabels.eaten : resolvedLabels.remaining}
              </span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 px-4 pb-5">
        <div className="flex flex-1 items-center justify-center">
          <svg
            role="img"
            aria-label={gaugeAriaLabel}
            viewBox={`0 0 ${vw} ${vh}`}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: compact ? 138 : 160,
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
              initial={
                shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }
              }
              animate={{ pathLength: 1, opacity: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 1.2, ease: "easeOut" }
              }
            />

            {/* Tick marks */}
            {map(ticks, (t, i) => (
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
              initial={shouldReduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { delay: 0.8, type: "spring", bounce: 0.4 }
              }
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
              className={centerIsOver ? "text-red-500" : "text-foreground/60"}
            />
            <text
              x={cx}
              y={cy - 26}
              textAnchor="middle"
              style={{
                fill: centerIsOver
                  ? "#ef4444"
                  : "var(--color-muted-foreground, #888)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {centerLabel}
            </text>
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              style={{
                fill: centerIsOver ? "#ef4444" : "currentColor",
                fontSize: 34,
                fontWeight: 900,
              }}
            >
              {centerValueLabel}
            </text>
            <text
              x={cx}
              y={cy + 26}
              textAnchor="middle"
              style={{
                fill: centerIsOver
                  ? "#f87171"
                  : "var(--color-muted-foreground, #888)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {resolvedLabels.kcal}
            </text>
          </svg>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div
      className={cn(
        "grid h-full w-full min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-4",
        className,
      )}
    >
      {gaugeCard}
      <MacroCardGrid
        macroItems={macroItems}
        isInteractive={isInteractive}
        onClick={onClick}
      />
    </div>
  );
}
