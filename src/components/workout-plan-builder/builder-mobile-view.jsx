import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { map, get, size } from "lodash";
import {
  PlusIcon,
  DumbbellIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";
import { Card } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.jsx";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  getWorkoutExerciseSummary,
  getWorkoutTrackingFields,
  createWorkoutSetTemplate,
} from "@/lib/workout-tracking";

const BuilderMobileView = memo(({
  trainDays,
  selectedDay,
  selectedDayId,
  selectedDayExercises,
  lockWeekDays,
  onUpdateDay,
  onUpdateExercise,
  onRemoveExercise,
  onOpenMobileLibrary,
}) => {
  const { t } = useTranslation();

  if (size(trainDays) === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
        <div className="text-center py-16 px-4 border-2 border-dashed rounded-2xl text-muted-foreground">
          <DumbbellIcon className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">
            {t("components.workoutPlanBuilder.mobile.noDays")}
          </p>
          <p className="text-sm mt-1 mb-4">
            {t("components.workoutPlanBuilder.mobile.pressAddDay")}
          </p>
        </div>
      </div>
    );
  }

  if (!selectedDay) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">{t("components.workoutPlanBuilder.mobile.selectDay")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-28">
      {/* Day name & focus — compact */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 min-w-0">
          {lockWeekDays ? (
            <p className="text-xs font-black uppercase tracking-wider text-foreground px-1">
              {get(selectedDay, "name")}
            </p>
          ) : (
            <Input
              value={get(selectedDay, "name")}
              onChange={(e) =>
                onUpdateDay(get(selectedDay, "id"), { name: e.target.value })
              }
              className="h-7 font-black text-xs bg-muted/30 border-transparent focus:bg-background focus:border-border px-2 rounded-lg"
              placeholder={t("components.workoutPlanBuilder.column.dayNamePlaceholder")}
            />
          )}
        </div>
        <Input
          value={get(selectedDay, "focus", "")}
          onChange={(e) =>
            onUpdateDay(get(selectedDay, "id"), { focus: e.target.value })
          }
          className="h-7 w-28 text-[11px] text-muted-foreground bg-muted/20 border-transparent focus:bg-background focus:border-border px-2 rounded-lg"
          placeholder={t("components.workoutPlanBuilder.column.focusPlaceholder")}
        />
      </div>

      {size(selectedDayExercises) === 0 ? (
        <button
          type="button"
          onClick={onOpenMobileLibrary}
          className="w-full text-center py-10 px-4 border-2 border-dashed rounded-2xl text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          <DumbbellIcon className="size-7 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium text-foreground">
            {t("components.workoutPlanBuilder.mobile.addExercise")}
          </p>
          <p className="text-[11px] mt-0.5">{t("components.workoutPlanBuilder.mobile.chooseFromLibrary")}</p>
        </button>
      ) : (
        <>
          <div className="space-y-1.5">
            {map(selectedDayExercises, (ex) => (
              <div
                key={get(ex, "id")}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-border/40 bg-card/60 hover:border-primary/30 transition-colors"
              >
                <span className="text-base shrink-0">{get(ex, "emoji")}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate leading-tight">
                    {get(ex, "name")}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">
                    {getWorkoutExerciseSummary(ex, t)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Settings2Icon className="size-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[320px] rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-black">
                          {get(ex, "name")}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {t("components.workoutPlanBuilder.tracking.sets")}
                          </label>
                          <NumberField
                            value={size(get(ex, "sets", []))}
                            onValueChange={(nextSetCount) => {
                              const count = Math.max(1, nextSetCount || 1);
                              const existingSets = get(ex, "sets", []);
                              const nextSets = Array.from(
                                { length: count },
                                (_, setIndex) =>
                                  createWorkoutSetTemplate(
                                    ex,
                                    get(existingSets, [setIndex]) ||
                                      get(existingSets, [size(existingSets) - 1]),
                                  ),
                              );
                              onUpdateExercise(selectedDayId, get(ex, "id"), {
                                sets: nextSets,
                              });
                            }}
                            min={1}
                            step={1}
                          >
                            <NumberFieldGroup className="h-10 rounded-xl">
                              <NumberFieldDecrement />
                              <NumberFieldInput className="text-center font-bold" />
                              <NumberFieldIncrement />
                            </NumberFieldGroup>
                          </NumberField>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {t("components.workoutPlanBuilder.tracking.rest")}
                          </label>
                          <NumberField
                            value={Number(get(ex, "rest", 60))}
                            onValueChange={(val) =>
                              onUpdateExercise(selectedDayId, get(ex, "id"), {
                                rest: val || 0,
                              })
                            }
                            min={0}
                            step={5}
                          >
                            <NumberFieldGroup className="h-10 rounded-xl">
                              <NumberFieldDecrement />
                              <NumberFieldInput className="text-center font-bold" />
                              <NumberFieldIncrement />
                            </NumberFieldGroup>
                          </NumberField>
                        </div>
                        {map(
                          getWorkoutTrackingFields(get(ex, "trackingType"), t),
                          (field) => (
                            <div key={get(field, "key")} className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {get(field, "label")}
                              </label>
                              <NumberField
                                value={
                                  Number(
                                    get(
                                      get(ex, "sets[0]"),
                                      get(field, "key"),
                                      0,
                                    ),
                                  ) || undefined
                                }
                                onValueChange={(nextValue) => {
                                  const val = nextValue || 0;
                                  onUpdateExercise(
                                    selectedDayId,
                                    get(ex, "id"),
                                    {
                                      sets: map(
                                        get(ex, "sets", []),
                                        (set) => ({
                                          ...set,
                                          [get(field, "key")]: val,
                                        }),
                                      ),
                                    },
                                  );
                                }}
                                min={get(field, "min", 0)}
                                step={get(field, "step", 1)}
                              >
                                <NumberFieldGroup className="h-10 rounded-xl">
                                  <NumberFieldDecrement />
                                  <NumberFieldInput
                                    className="text-center font-bold"
                                    placeholder={get(field, "placeholder")}
                                  />
                                  <NumberFieldIncrement />
                                </NumberFieldGroup>
                              </NumberField>
                            </div>
                          ),
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveExercise(selectedDayId, get(ex, "id"))
                    }
                    className="p-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add exercise button — after the list */}
          <button
            type="button"
            onClick={onOpenMobileLibrary}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-border/40 text-muted-foreground text-xs font-bold hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all active:scale-[0.98]"
          >
            <PlusIcon className="size-3.5" />
            {t("components.workoutPlanBuilder.mobile.addExerciseButton")}
          </button>
        </>
      )}
    </div>
  );
});

export default BuilderMobileView;
