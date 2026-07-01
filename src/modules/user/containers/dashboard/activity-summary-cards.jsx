import React from "react";
import { Link } from "react-router";
import { clamp, get } from "lodash";
import {
  FootprintsIcon,
  MoonIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MetricEntryDrawer from "@/modules/user/containers/daily-metric-detail/metric-entry-drawer.jsx";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatSteps = (value) =>
  numberFormatter.format(Math.max(0, Math.round(value || 0)));

const formatSleep = (value) => {
  const safeValue = Math.max(0, Number(value || 0));
  const hours = Math.floor(safeValue);
  const minutes = Math.round((safeValue - hours) * 60);

  if (minutes <= 0) {
    return `${hours} soat`;
  }

  return `${hours} soat ${minutes} daq`;
};

const getProgress = (value, goal) =>
  clamp(goal > 0 ? (Number(value || 0) / goal) * 100 : 0, 0, 100);

const ActivitySummaryCard = ({
  currentGoal,
  currentValue,
  dateKey,
  metric,
  to,
  label,
  value,
  goalLabel,
  progress,
  Icon,
  tone,
  source,
}) => {
  const safeProgress = clamp(Number(progress || 0), 0, 100);
  const sourceLabel = source === "google_health" ? "Google Health" : null;

  return (
    <div
      className={cn(
        "group relative min-h-[136px] overflow-hidden rounded-[1.55rem] bg-card p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-card/95",
        "border border-border/35",
      )}
    >
      <Link
        to={to}
        aria-label={`${label} detail`}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />
      <div
        className={cn(
          "pointer-events-none absolute -right-7 -top-10 size-24 rounded-full opacity-40 blur-2xl",
          tone === "steps" ? "bg-primary/20" : "bg-muted",
        )}
      />
      <MetricEntryDrawer
        metric={metric}
        dateKey={dateKey}
        currentValue={currentValue}
        currentGoal={currentGoal}
        variant="quick"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${label} kiritish`}
          className={cn(
            "absolute right-3 top-3 z-20 size-10 rounded-full border border-border/45 bg-card/85 p-0 shadow-sm backdrop-blur-sm hover:bg-card focus-visible:ring-2 focus-visible:ring-primary/30",
            tone === "steps"
              ? "text-primary hover:text-primary"
              : "text-foreground hover:text-foreground",
          )}
        >
          <PlusIcon className="size-5" aria-hidden="true" />
        </Button>
      </MetricEntryDrawer>
      <div className="pointer-events-none relative z-10 flex min-h-[104px] flex-col justify-between pr-9">
        <div className="flex min-w-0 items-start justify-between gap-2 pr-11">
          <p className="truncate text-[15px] font-black text-foreground">
            {label}
          </p>
          {sourceLabel ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
              {sourceLabel}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 pr-12">
          <p className="truncate text-2xl font-black leading-none text-foreground">
            {value}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
            {goalLabel} goal
          </p>
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-3 right-3 z-10 grid size-12 place-items-center rounded-full p-1"
        style={{
          background: `conic-gradient(var(--color-primary) ${safeProgress}%, color-mix(in oklab, var(--color-muted) 82%, transparent) 0)`,
        }}
      >
        <span className="grid size-full place-items-center rounded-full bg-card text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
};

const ActivitySummaryCards = ({ dateKey, dayData, goalsState }) => {
  const steps = Number(get(dayData, "steps", 0)) || 0;
  const sleepHours = Number(get(dayData, "sleepHours", 0)) || 0;
  const stepsSource = get(dayData, "stepsSource", "manual");
  const sleepSource = get(dayData, "sleepSource", "manual");
  const stepsGoal = Number(get(goalsState, "goals.steps", 10000)) || 10000;
  const sleepGoal = Number(get(goalsState, "goals.sleepHours", 8)) || 8;

  return (
    <div
      className="grid grid-cols-2 gap-3"
    >
      <ActivitySummaryCard
        to={`/user/steps?date=${dateKey}`}
        metric="steps"
        dateKey={dateKey}
        label="Qadamlar"
        currentValue={steps}
        currentGoal={stepsGoal}
        value={formatSteps(steps)}
        goalLabel={formatSteps(stepsGoal)}
        progress={getProgress(steps, stepsGoal)}
        Icon={FootprintsIcon}
        tone="steps"
        source={stepsSource}
      />
      <ActivitySummaryCard
        to={`/user/sleep?date=${dateKey}`}
        metric="sleep"
        dateKey={dateKey}
        label="Uyqu"
        currentValue={sleepHours}
        currentGoal={sleepGoal}
        value={formatSleep(sleepHours)}
        goalLabel={formatSleep(sleepGoal)}
        progress={getProgress(sleepHours, sleepGoal)}
        Icon={MoonIcon}
        tone="sleep"
        source={sleepSource}
      />
    </div>
  );
};

export default ActivitySummaryCards;
