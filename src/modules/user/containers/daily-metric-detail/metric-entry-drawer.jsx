import React from "react";
import { CheckCircle2Icon, TargetIcon } from "lucide-react";
import { filter, map } from "lodash";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { METRICS, isDateKey } from "./metric-config.js";

const MetricEntryDrawer = ({
  children,
  currentGoal,
  currentValue,
  dateKey,
  metric,
  onDateChange,
  variant = "full",
}) => {
  const config = METRICS[metric] ?? METRICS.steps;
  const isQuickEntry = variant === "quick";
  const { setSteps, setSleep } = useDailyTrackingActions();
  const { setGoal, isSaving: isGoalSaving } = useHealthGoals();
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [value, setValue] = React.useState(() => String(currentValue));
  const [goalValue, setGoalValue] = React.useState(() => String(currentGoal));
  const [entryDate, setEntryDate] = React.useState(dateKey);

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) {
      setValue(String(currentValue));
      setGoalValue(String(currentGoal));
      setEntryDate(dateKey);
    }

    setOpen(nextOpen);
  };

  const handleQuickAction = (action) => {
    const current = config.normalizeValue(value);
    const nextValue =
      action.mode === "add"
        ? current + action.value
        : action.mode === "goal"
          ? currentGoal
          : action.value;

    setValue(String(config.normalizeValue(nextValue)));
  };

  const handleDateInputChange = (event) => {
    const nextDate = event.target.value;

    setEntryDate(nextDate);
    if (isDateKey(nextDate)) {
      onDateChange?.(nextDate);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isDateKey(entryDate)) {
      toast.error("Sana noto'g'ri");
      return;
    }

    const normalizedValue = config.normalizeValue(value);
    const normalizedGoal = isQuickEntry
      ? config.normalizeValue(currentGoal)
      : config.normalizeValue(goalValue);

    try {
      setIsSaving(true);
      if (metric === "sleep") {
        await setSleep(entryDate, normalizedValue);
      } else {
        await setSteps(entryDate, normalizedValue);
      }

      if (!isQuickEntry && normalizedGoal !== config.normalizeValue(currentGoal)) {
        await setGoal(config.goalKey, normalizedGoal);
      }

      toast.success(config.savedMessage);
      setOpen(false);
    } catch {
      toast.error("Ma'lumotni saqlab bo'lmadi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      {open ? (
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              {isQuickEntry ? `${config.title} qo'shish` : `${config.title} kiritish`}
            </DrawerTitle>
            <DrawerDescription>
              {isQuickEntry
                ? "Dashboardda tanlangan kun uchun tezkor yozuv."
                : "Bugungi qiymat va kunlik maqsadni yangilang."}
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DrawerBody className="flex flex-col gap-4">
              {isQuickEntry ? (
                <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/45 bg-muted/35 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <TargetIcon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Maqsad
                      </p>
                      <p className="truncate text-sm font-bold">
                        Maqsad: {config.formatGoal(currentGoal)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`${metric}-entry-value`}>
                    {config.valueLabel}
                  </Label>
                  <Input
                    id={`${metric}-entry-value`}
                    type="number"
                    min="0"
                    max={metric === "sleep" ? "16" : undefined}
                    step={config.inputStep}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </div>
                {!isQuickEntry ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`${metric}-entry-goal`}>
                        {config.goalLabel}
                      </Label>
                      <Input
                        id={`${metric}-entry-goal`}
                        type="number"
                        min="0"
                        max={metric === "sleep" ? "16" : undefined}
                        step={config.inputStep}
                        value={goalValue}
                        onChange={(event) => setGoalValue(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${metric}-entry-date`}>Sana</Label>
                      <Input
                        id={`${metric}-entry-date`}
                        type="date"
                        value={entryDate}
                        onChange={handleDateInputChange}
                      />
                    </div>
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {map(
                  filter(
                    config.quickActions,
                    (action) => !isQuickEntry || action.mode !== "goal",
                  ),
                  (action) => (
                    <Button
                      key={action.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-card"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action.label}
                    </Button>
                  ),
                )}
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button
                type="submit"
                className="h-12 rounded-full"
                disabled={isSaving || isGoalSaving}
              >
                <CheckCircle2Icon data-icon="inline-start" />
                Saqlash
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      ) : null}
    </Drawer>
  );
};

export default MetricEntryDrawer;
