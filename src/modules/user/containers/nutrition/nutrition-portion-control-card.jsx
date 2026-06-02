import React from "react";
import { Slider } from "@/components/ui/slider";
import GaugeProgress from "@/components/meal-plan-builder/gauge-progress.jsx";
import { cn } from "@/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";
import filter from "lodash/filter";
import map from "lodash/map";
import toNumber from "lodash/toNumber";

const GRAM_BASED_UNITS = new Set(["g", "ml"]);
const DEFAULT_GOALS = {
  protein: 0,
  carbs: 0,
  fat: 0,
};

const normalizeNumber = (value, fallback = 0) => {
  const normalized = toNumber(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

export const formatPortionNumber = (value) => {
  const normalized = normalizeNumber(value);
  return Number.isInteger(normalized)
    ? normalized.toLocaleString("en-US")
    : normalized.toLocaleString("en-US", { maximumFractionDigits: 1 });
};

export const formatPortionAmount = (value, unit) =>
  `${formatPortionNumber(value)}${unit || "g"}`;

const getMacroPercent = (value, target) => {
  const safeTarget = normalizeNumber(target, 1) || 1;
  return Math.max(0, Math.min(100, Math.round((normalizeNumber(value) / safeTarget) * 100)));
};

const buildMacroCards = (macros, goals) => [
  {
    key: "carbs",
    label: "Uglevod",
    value: macros?.carbs ?? 0,
    target: goals?.carbs ?? 0,
    barClassName: "bg-lime-500",
  },
  {
    key: "protein",
    label: "Oqsil",
    value: macros?.protein ?? 0,
    target: goals?.protein ?? 0,
    barClassName: "bg-orange-500",
  },
  {
    key: "fat",
    label: "Yog'",
    value: macros?.fat ?? 0,
    target: goals?.fat ?? 0,
    barClassName: "bg-violet-500",
  },
];

const getSliderPercent = (value, min, max) => {
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};

const getPortionSliderMarks = ({ min, max }) =>
  filter([0, 250, 500, 750, 1000], (value) => value >= min && value <= max);

const stopDrawerDrag = (event) => {
  event.stopPropagation();
};

export default function NutritionPortionControlCard({
  id = "nutrition-portion",
  macros,
  goals = DEFAULT_GOALS,
  value,
  unit = "g",
  min = 0,
  max = 1000,
  step = 10,
  gaugeMax,
  onValueChange,
  testIdPrefix = "food-detail",
  sliderTestId = "portion-slider",
  label = "QO'SHILMOQDA",
  className,
}) {
  const currentValue = normalizeNumber(value, 0);
  const macroCards = buildMacroCards(macros, goals);
  const sliderMarks = getPortionSliderMarks({ min, max });
  const isGramBased = GRAM_BASED_UNITS.has(unit);

  return (
    <div
      data-testid={`${testIdPrefix}-nutrition-control-card`}
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-3 pb-4 shadow-sm",
        className,
      )}
    >
      <div data-testid={`${testIdPrefix}-chart-card`} className="pb-4">
        <div className="-mt-4">
          <GaugeProgress
            value={macros?.cal ?? 0}
            max={gaugeMax || macros?.cal || 1}
            id={id}
            label={label}
          />
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-2 border-t border-border/50 pt-3">
        {map(macroCards, (macro) => (
          <div
            key={macro.key}
            data-testid={`${testIdPrefix}-macro-${macro.key}`}
            className="min-w-0 rounded-xl border border-border/50 bg-muted/25 px-2.5 py-2"
          >
            <div className="flex items-start justify-between gap-1.5">
              <span className="truncate text-xs font-bold text-foreground/80">
                {macro.label}
              </span>
              <MoreHorizontalIcon className="size-3.5 shrink-0 text-foreground/60" />
            </div>
            <div className="mt-1.5 flex min-w-0 items-baseline gap-1">
              <span className="text-lg font-black leading-none text-foreground">
                {formatPortionNumber(macro.value)}
              </span>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                / {formatPortionNumber(macro.target)}g
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", macro.barClassName)}
                style={{ width: `${getMacroPercent(macro.value, macro.target)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        data-testid={`${testIdPrefix}-portion-slider-section`}
        className="mt-4 border-t border-border/60 pt-3"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight text-foreground">
              Miqdori
            </h3>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {isGramBased
                ? "Porsiya og'irligini tanlang"
                : "Porsiya miqdorini tanlang"}
            </p>
          </div>
          <div className="shrink-0 text-2xl font-black leading-none text-primary">
            {formatPortionAmount(currentValue, unit)}
          </div>
        </div>

        <Slider
          data-testid={sliderTestId}
          data-vaul-no-drag=""
          value={[currentValue]}
          min={min}
          max={max}
          step={step}
          onValueChange={onValueChange}
          onMouseDown={stopDrawerDrag}
          onPointerDown={stopDrawerDrag}
          onTouchStart={stopDrawerDrag}
          className="mt-4 py-1.5 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-thumb]]:shadow-[0_0_0_3px_hsl(var(--background)),0_2px_8px_rgba(0,0,0,0.14)] [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-muted/80"
        />
        <div className="relative mt-3 h-8">
          {map(sliderMarks, (mark, index) => {
            const isCurrent = Math.round(mark) === Math.round(currentValue);
            const isFirst = index === 0;
            const isLast = index === sliderMarks.length - 1;
            return (
              <div
                key={mark}
                className={cn(
                  "absolute top-0 flex flex-col gap-1.5",
                  isFirst
                    ? "items-start"
                    : isLast
                      ? "-translate-x-full items-end"
                      : "-translate-x-1/2 items-center",
                )}
                style={{ left: `${getSliderPercent(mark, min, max)}%` }}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isCurrent ? "bg-primary" : "bg-muted-foreground/25",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-semibold leading-none",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {formatPortionAmount(mark, unit)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
