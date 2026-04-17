import React, { memo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GripVerticalIcon, Trash2Icon, ClockIcon, Settings2Icon, CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { get, map, filter, size, includes, isNil, isArray } from "lodash";
import { cn } from "@/lib/utils";
import { KanbanItem, KanbanItemHandle } from "@/components/reui/kanban";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  createWorkoutSetTemplate,
  getWorkoutExerciseSummary,
  getWorkoutTrackingFields,
  normalizeWorkoutTrackingType,
  formatDurationInput,
  parseWorkoutDurationSeconds
} from "@/lib/workout-tracking";

const SortableExerciseItem = memo(({ item, colId, onRemove, onUpdate }) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [localSets, setLocalSets] = useState(item.sets || []);
  const [localRest, setLocalRest] = useState(item.rest || 60);
  const trackingType = normalizeWorkoutTrackingType(item.trackingType);
  const trackingFields = getWorkoutTrackingFields(trackingType, t);
  const setGridClass =
    size(trackingFields) === 1
      ? "grid grid-cols-[36px_1fr_40px] items-center gap-3 rounded-xl border bg-card p-2 shadow-sm sm:grid-cols-[44px_1fr_48px]"
      : "grid grid-cols-[36px_1fr_1fr_40px] items-center gap-3 rounded-xl border bg-card p-2 shadow-sm sm:grid-cols-[44px_1fr_1fr_48px]";

  useEffect(() => {
    if (isDrawerOpen) {
      setLocalSets(item.sets || []);
      setLocalRest(item.rest || 60);
    }
  }, [isDrawerOpen, item.sets, item.rest]);

  const handleAddSet = () => {
    const lastSet = get(localSets, [size(localSets) - 1]) || null;
    setLocalSets([...localSets, createWorkoutSetTemplate(item, lastSet)]);
  };

  const handleRemoveSet = (index) => {
    setLocalSets(filter(localSets, (_, i) => i !== index));
  };

  const updateSet = (index, field, value) => {
    const nextValue =
      !isNil(value) && !Number.isNaN(value)
        ? Number(value)
        : 0;
    setLocalSets(map(localSets, (s, i) => i === index ? { ...s, [field]: nextValue } : s));
  };

  const handleSaveEdit = () => {
    onUpdate(colId, item.id, {
      sets: localSets,
      rest: parseInt(localRest) || 0,
    });
    setIsDrawerOpen(false);
  };

  return (
    <KanbanItem
      value={item.id}
      className={cn(
        "group bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-3 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-card/90 transition-all relative flex items-center gap-3 overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-muted/20 to-transparent pointer-events-none" />
      <KanbanItemHandle className="p-1 -ml-1 text-muted-foreground opacity-30 hover:opacity-100 transition-opacity z-20">
        <GripVerticalIcon className="size-4" />
      </KanbanItemHandle>

      <div className="size-10 rounded-xl bg-muted/40 flex items-center justify-center text-xl shrink-0 border border-border/40 relative z-10 group-hover:bg-background transition-colors">
        <span>{item.emoji}</span>
      </div>

      <div className="flex-1 min-w-0 pr-12 relative z-10">
        <p className="text-sm font-black truncate text-foreground/90 group-hover:text-primary transition-colors">
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="secondary"
            className="text-[9px] font-bold px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20"
          >
            {size(get(item, "sets"))} {t("components.workoutPlanBuilder.tracking.sets")}
          </Badge>
          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground font-bold">
            <ClockIcon className="size-2.5" />
            {item.rest}{t("components.workoutPlanBuilder.units.seconds")}
          </span>
          <span className="text-[9px] text-muted-foreground font-bold">
            {getWorkoutExerciseSummary(item, t)}
          </span>
        </div>
      </div>

      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          className="size-7 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-border/50"
          onClick={(e) => {
            e.stopPropagation();
            setIsDrawerOpen(true);
          }}
        >
          <Settings2Icon className="size-3" />
        </button>

        <button
          type="button"
          aria-label={t("components.workoutPlanBuilder.column.deleteExerciseLabel", { name: item.name })}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(colId, item.id);
          }}
          className="size-7 rounded-full flex items-center justify-center bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-all"
        >
          <Trash2Icon className="size-3" />
        </button>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md outline-none">
          <DrawerHeader className="px-6 py-4">
            <DrawerTitle className="text-xl font-bold text-center">
              {t("components.workoutPlanBuilder.tracking.editSets")}
            </DrawerTitle>
            <DrawerDescription className="text-center">
              {t("components.workoutPlanBuilder.tracking.editSetsDesc", { name: item.name })}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-6 px-6 py-4">
            {/* Exercise Info Section */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl shadow-inner">
                {item.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  {t("components.workoutPlanBuilder.tracking.setsInstruction")}
                </p>
              </div>
            </div>

            {/* Sets Editor Section */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-muted-foreground tracking-widest px-1 uppercase">
                {t("components.workoutPlanBuilder.tracking.exerciseSets")}
              </span>
              
              <div className="flex flex-col gap-4">
                <div
                  className={cn(
                    "grid gap-3 px-2 pb-1",
                    size(trackingFields) === 1 
                      ? "grid-cols-[36px_1fr_40px] sm:grid-cols-[44px_1fr_48px]" 
                      : "grid-cols-[36px_1fr_1fr_40px] sm:grid-cols-[44px_1fr_1fr_48px]"
                  )}
                >
                  <span className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {t("components.workoutPlanBuilder.tracking.setLabel")}
                  </span>
                  {map(trackingFields, (field) => (
                    <span
                      key={get(field, "key")}
                      className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60"
                    >
                      {get(field, "label")}
                    </span>
                  ))}
                  <span />
                </div>

                <div className="flex flex-col gap-3">
                  {map(localSets, (set, idx) => (
                    <div key={idx} className={setGridClass}>
                      <div className="flex justify-center">
                        <span className="flex items-center justify-center size-8 rounded-xl bg-muted/50 text-xs font-black text-muted-foreground border border-border/40">
                          {idx + 1}
                        </span>
                      </div>

                      {map(trackingFields, (field) => (
                        <div key={get(field, "key")} className="flex justify-center">
                          <NumberField
                            value={Number(get(set, get(field, "key"))) || undefined}
                            onValueChange={(val) =>
                              updateSet(idx, get(field, "key"), val)
                            }
                            min={get(field, "min")}
                            step={get(field, "step")}
                          >
                            <NumberFieldGroup className="h-11 rounded-xl border-border/50 bg-background shadow-none transition-all focus-within:ring-1 focus-within:border-primary/50">
                              <NumberFieldDecrement className="w-8 border-r-border/50 hover:bg-muted/50" />
                              <NumberFieldInput
                                className="text-center text-sm font-bold"
                                placeholder={get(field, "placeholder")}
                              />
                              <NumberFieldIncrement className="w-8 border-l-border/50 hover:bg-muted/50" />
                            </NumberFieldGroup>
                          </NumberField>
                        </div>
                      ))}

                      <div className="flex justify-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => handleRemoveSet(idx)}
                          disabled={size(localSets) === 1}
                        >
                          <XIcon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 py-6 rounded-2xl hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all group"
                  onClick={handleAddSet}
                >
                  <PlusIcon className="mr-2 size-4 group-hover:scale-110 transition-transform" />
                  {t("components.workoutPlanBuilder.tracking.addSet")}
                </Button>
              </div>
            </div>

            {/* Rest Time Section */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-muted-foreground tracking-widest px-1 uppercase">
                {t("components.workoutPlanBuilder.tracking.restTime")}
              </span>
              <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                    <ClockIcon className="size-5" />
                  </div>
                  <span className="font-bold text-foreground">{t("components.workoutPlanBuilder.units.seconds")}</span>
                </div>
                <div className="w-32">
                  <NumberField
                    value={Number(localRest) || 60}
                    onValueChange={(val) => setLocalRest(val)}
                    min={0}
                    step={5}
                  >
                    <NumberFieldGroup className="h-11 rounded-xl border-border/50 bg-background shadow-none transition-all focus-within:ring-1 focus-within:border-primary/50">
                      <NumberFieldDecrement className="w-8 border-r-border/50 hover:bg-muted/50" />
                      <NumberFieldInput className="text-center text-sm font-bold" />
                      <NumberFieldIncrement className="w-8 border-l-border/50 hover:bg-muted/50" />
                    </NumberFieldGroup>
                  </NumberField>
                </div>
              </div>
            </div>
          </DrawerBody>

          <DrawerFooter className="px-6 py-4 flex flex-col gap-3">
            <Button 
              size="lg"
              className="w-full"
              onClick={handleSaveEdit} 
            >
              <CheckIcon className="mr-2 size-5" /> {t("common.save")}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => setIsDrawerOpen(false)} 
            >
              {t("common.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </KanbanItem>
  );
});

export default SortableExerciseItem;
