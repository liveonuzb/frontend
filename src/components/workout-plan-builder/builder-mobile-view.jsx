import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { map, get, size, some } from "lodash";
import {
  PlusIcon,
  DumbbellIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MoreVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
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
  const [expandedExerciseId, setExpandedExerciseId] = React.useState(null);

  React.useEffect(() => {
    const hasExpandedExercise = some(
      selectedDayExercises,
      (exercise) => get(exercise, "id") === expandedExerciseId,
    );

    if (size(selectedDayExercises) > 0 && !hasExpandedExercise) {
      setExpandedExerciseId(get(selectedDayExercises, "[0].id"));
    }
  }, [expandedExerciseId, selectedDayExercises]);

  const handleUpdateSet = (exercise, setIndex, fieldKey, value) => {
    const nextValue = value || 0;
    onUpdateExercise(selectedDayId, get(exercise, "id"), {
      sets: map(get(exercise, "sets", []), (set, index) =>
        index === setIndex ? { ...set, [fieldKey]: nextValue } : set,
      ),
    });
  };

  const handleAddSet = (exercise) => {
    const existingSets = get(exercise, "sets", []);
    const lastSet = get(existingSets, [size(existingSets) - 1]);

    onUpdateExercise(selectedDayId, get(exercise, "id"), {
      sets: [...existingSets, createWorkoutSetTemplate(exercise, lastSet)],
    });
    setExpandedExerciseId(get(exercise, "id"));
  };

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
          <div className="flex flex-col gap-3">
            {map(selectedDayExercises, (ex) => {
              const isExpanded = expandedExerciseId === get(ex, "id");
              const trackingFields = getWorkoutTrackingFields(
                get(ex, "trackingType"),
                t,
              );
              const gridClass =
                size(trackingFields) === 1
                  ? "grid-cols-[36px_1fr]"
                  : "grid-cols-[36px_1fr_1fr]";

              return (
                <div
                  key={get(ex, "id")}
                  className="overflow-hidden rounded-3xl border bg-card shadow-sm"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-4 text-left"
                    onClick={() =>
                      setExpandedExerciseId(isExpanded ? null : get(ex, "id"))
                    }
                  >
                    <span className="text-muted-foreground">
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </span>
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted/40 text-xl">
                      {get(ex, "imageUrl") ? (
                        <img
                          src={get(ex, "imageUrl")}
                          alt={get(ex, "name")}
                          className="size-full rounded-2xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        get(ex, "emoji") || "🏋️"
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-black">
                        {get(ex, "name")}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {size(get(ex, "sets", []))} Sets
                      </span>
                    </span>
                    <MoreVerticalIcon className="text-muted-foreground" />
                  </button>

                  {isExpanded ? (
                    <div className="flex flex-col gap-3 px-4 pb-4">
                      {map(get(ex, "sets", []), (set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`grid ${gridClass} items-center gap-3 rounded-2xl bg-muted/50 px-3 py-3`}
                        >
                          <span className="text-center text-lg font-black">
                            {setIndex + 1}
                          </span>
                          {map(trackingFields, (field) => (
                            <NumberField
                              key={get(field, "key")}
                              value={
                                Number(get(set, get(field, "key"))) ||
                                undefined
                              }
                              onValueChange={(value) =>
                                handleUpdateSet(
                                  ex,
                                  setIndex,
                                  get(field, "key"),
                                  value,
                                )
                              }
                              min={get(field, "min")}
                              step={get(field, "step")}
                            >
                              <NumberFieldGroup className="h-12 rounded-2xl bg-background">
                                <NumberFieldDecrement />
                                <NumberFieldInput className="text-center text-lg font-black" />
                                <NumberFieldIncrement />
                              </NumberFieldGroup>
                            </NumberField>
                          ))}
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        className="w-full rounded-2xl border-dashed"
                        onClick={() => handleAddSet(ex)}
                      >
                        <PlusIcon data-icon="inline-start" />
                        Add a set
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full text-destructive"
                        onClick={() =>
                          onRemoveExercise(selectedDayId, get(ex, "id"))
                        }
                      >
                        <Trash2Icon data-icon="inline-start" />
                        Mashqni o'chirish
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
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
