import React from "react";
import {
  CalendarIcon,
  CheckIcon,
  ChevronUpIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import find from "lodash/find";
import get from "lodash/get";
import map from "lodash/map";
import range from "lodash/range";
import size from "lodash/size";
import toNumber from "lodash/toNumber";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMealPlan } from "@/hooks/app/use-meal-plan.js";
import {
  DEFAULT_MEAL_TYPE,
  MEAL_LABELS,
  MEAL_TYPE_OPTIONS,
} from "@/modules/user/lib/meal-config.js";
import { cn } from "@/lib/utils.js";
import {
  formatNumber,
  getRecipeActionId,
  getRecipeNutrition,
} from "../recipe-ui-utils.js";

const getTodayDateKey = () => new Date().toISOString().slice(0, 10);

const getCurrentTimeKey = () => new Date().toTimeString().slice(0, 5);

const buildAddedAt = (date, time) => {
  if (!date || !time) {
    return undefined;
  }

  const addedAt = new Date(`${date}T${time}:00`);

  return Number.isNaN(addedAt.getTime()) ? undefined : addedAt.toISOString();
};

const getDefaultMealType = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return "breakfast";
  }
  if (hour >= 11 && hour < 16) {
    return "lunch";
  }
  if (hour >= 16 && hour < 21) {
    return "dinner";
  }

  return DEFAULT_MEAL_TYPE;
};

const buildPlanDayOptions = (plan) => {
  if (!plan) {
    return [];
  }

  if (plan.days?.length) {
    return map(plan.days, (day) => ({
      value: day.dayKey || `day-${day.dayNumber}`,
      label: `${day.dayNumber || 1}-kun`,
    }));
  }

  return map(range(1, (plan.durationDays || 7) + 1), (dayNumber) => ({
    value: `day-${dayNumber}`,
    label: `${dayNumber}-kun`,
  }));
};

const getFirstPlanDayKey = (plan) =>
  buildPlanDayOptions(plan)[0]?.value || "day-1";

const getErrorPayload = (error) =>
  get(error, "response.data") ||
  get(error, "response.data.data") ||
  get(error, "data") ||
  {};

const OptionPickerDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  options,
  value,
  onSelect,
}) => (
  <Drawer
    nested
    open={open}
    onOpenChange={onOpenChange}
    direction="bottom"
  >
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
        {description ? (
          <DrawerDescription>{description}</DrawerDescription>
        ) : null}
      </DrawerHeader>
      <DrawerBody className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          {map(options, (option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted/50",
                )}
                onClick={() => {
                  onSelect(option.value);
                  onOpenChange(false);
                }}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {selected ? <CheckIcon className="size-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      </DrawerBody>
    </DrawerContent>
  </Drawer>
);

const SelectionButton = ({ label, valueLabel, onClick, disabled }) => (
  <button
    type="button"
    className="flex h-12 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 text-left text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
    disabled={disabled}
    onClick={onClick}
  >
    <span className="min-w-0">
      <span className="block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="block truncate font-semibold text-foreground">
        {valueLabel}
      </span>
    </span>
    <ChevronUpIcon className="size-4 shrink-0 text-muted-foreground" />
  </button>
);

const ServingsStepper = ({ value, onChange }) => (
  <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-2">
    <span className="text-sm font-semibold text-foreground">Porsiya</span>
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label="Porsiyani kamaytirish"
        disabled={value <= 0.25}
        onClick={() => onChange(Math.max(0.25, value - 0.25))}
      >
        <MinusIcon />
      </Button>
      <Input
        aria-label="Porsiya"
        type="number"
        min="0.25"
        step="0.25"
        className="h-8 w-20 text-center"
        value={value}
        onChange={(event) =>
          onChange(Math.max(0.25, toNumber(event.target.value) || 0.25))
        }
      />
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label="Porsiyani oshirish"
        onClick={() => onChange(value + 0.25)}
      >
        <PlusIcon />
      </Button>
    </div>
  </div>
);

const NutritionPreview = ({ recipe, servings }) => {
  const nutrition = getRecipeNutrition(recipe, servings);
  const ingredientCount = size(recipe.ingredients || []);

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          Saqlashdan oldingi nutrition
        </p>
        <Badge variant="secondary">{ingredientCount} ingredient snapshot</Badge>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
        <div>
          <p className="font-semibold text-foreground">{nutrition.calories}</p>
          <p className="text-xs text-muted-foreground">Kkal</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {formatNumber(nutrition.protein)}g
          </p>
          <p className="text-xs text-muted-foreground">Protein</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {formatNumber(nutrition.carbs)}g
          </p>
          <p className="text-xs text-muted-foreground">Uglevod</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {formatNumber(nutrition.fat)}g
          </p>
          <p className="text-xs text-muted-foreground">Yog'</p>
        </div>
      </div>
    </div>
  );
};

const RecipeAddDrawer = ({
  open,
  recipe,
  initialServings = 1,
  addToMealLog,
  addToMealPlan,
  isSubmitting = false,
  onOpenChange,
}) => {
  const { plans = [], activePlan = null, isLoading } = useMealPlan({
    enabled: open,
  });
  const [mode, setMode] = React.useState("log");
  const [date, setDate] = React.useState(getTodayDateKey);
  const [time, setTime] = React.useState(getCurrentTimeKey);
  const [mealType, setMealType] = React.useState(getDefaultMealType);
  const [planMealType, setPlanMealType] = React.useState(getDefaultMealType);
  const [servings, setServings] = React.useState(1);
  const [planId, setPlanId] = React.useState("");
  const [dayKey, setDayKey] = React.useState("day-1");
  const [picker, setPicker] = React.useState(null);
  const [duplicatePayload, setDuplicatePayload] = React.useState(null);

  const defaultPlan = activePlan || plans[0] || null;
  const defaultPlanId = defaultPlan?.id || "";
  const defaultDayKey = getFirstPlanDayKey(defaultPlan);
  const resolvedPlanId = planId || defaultPlanId;
  const selectedPlan =
    find(plans, (plan) => plan.id === resolvedPlanId) || defaultPlan || null;
  const dayOptions = buildPlanDayOptions(selectedPlan);
  const resolvedDayKey = dayKey || getFirstPlanDayKey(selectedPlan);
  const planOptions = map(plans, (plan) => ({
    value: plan.id,
    label: plan.name || "Mening rejam",
  }));
  const recipeActionId = recipe ? getRecipeActionId(recipe) : "";
  const mealTypeLabel = MEAL_LABELS[mealType] || mealType;
  const planMealTypeLabel = MEAL_LABELS[planMealType] || planMealType;
  const dayLabel =
    find(dayOptions, (option) => option.value === resolvedDayKey)?.label ||
    "1-kun";
  const planLabel =
    find(planOptions, (option) => option.value === resolvedPlanId)?.label ||
    selectedPlan?.name ||
    "Reja tanlang";
  const selectedPlanStatus = String(selectedPlan?.status || "").toLowerCase();
  const planConflictMessage =
    selectedPlanStatus === "archived"
      ? "Arxivlangan rejaga retsept qo'shib bo'lmaydi."
      : selectedPlanStatus === "paused"
        ? "Pauzadagi rejaga retsept qo'shib bo'lmaydi."
        : "";

  React.useEffect(() => {
    if (!open || !recipeActionId) {
      return undefined;
    }

    let isCurrent = true;

    queueMicrotask(() => {
      if (!isCurrent) {
        return;
      }

      setMode("log");
      setDate(getTodayDateKey());
      setTime(getCurrentTimeKey());
      setMealType(getDefaultMealType());
      setPlanMealType(getDefaultMealType());
      setServings(Math.max(0.25, toNumber(initialServings) || 1));
      setPlanId(defaultPlanId);
      setDayKey(defaultDayKey);
      setDuplicatePayload(null);
    });

    return () => {
      isCurrent = false;
    };
  }, [defaultDayKey, defaultPlanId, initialServings, open, recipeActionId]);

  React.useEffect(() => {
    if (!selectedPlan || !dayOptions.length) {
      return undefined;
    }

    if (!find(dayOptions, (option) => option.value === dayKey)) {
      let isCurrent = true;

      queueMicrotask(() => {
        if (isCurrent) {
          setDayKey(dayOptions[0].value);
        }
      });

      return () => {
        isCurrent = false;
      };
    }

    return undefined;
  }, [dayKey, dayOptions, selectedPlan]);

  if (!recipe) {
    return null;
  }

  const closeDrawer = () => {
    onOpenChange(false);
    setDuplicatePayload(null);
  };

  const handleLogSubmit = async (confirmDuplicate = false) => {
    const payload = {
      date,
      mealType,
      servings,
      addedAt: buildAddedAt(date, time),
      ...(confirmDuplicate ? { confirmDuplicate: true } : {}),
    };

    try {
      await addToMealLog(recipeActionId, payload);
      toast.success("Retsept ovqat jurnaliga qo'shildi");
      closeDrawer();
    } catch (error) {
      const errorPayload = getErrorPayload(error);

      if (errorPayload.requiresConfirmation) {
        setDuplicatePayload(payload);
        toast.error("Bu retsept ushbu ovqat vaqtiga avval qo'shilgan");
        return;
      }

      toast.error("Retseptni ovqat jurnaliga qo'shib bo'lmadi");
    }
  };

  const handlePlanSubmit = async () => {
    if (!resolvedPlanId) {
      toast.error("Reja tanlang");
      return;
    }

    if (planConflictMessage) {
      toast.error(planConflictMessage);
      return;
    }

    try {
      await addToMealPlan(recipeActionId, {
        planId: resolvedPlanId,
        dayKey: resolvedDayKey,
        mealType: planMealType,
        servings,
      });
      toast.success("Retsept rejaga qo'shildi");
      closeDrawer();
    } catch {
      toast.error("Retseptni rejaga qo'shib bo'lmadi");
    }
  };

  const activePicker =
    picker === "meal"
      ? {
          title: "Ovqat turini tanlang",
          description: "Retsept qaysi ovqat vaqtiga qo'shiladi?",
          options: MEAL_TYPE_OPTIONS,
          value: mealType,
          onSelect: setMealType,
        }
      : picker === "planMeal"
        ? {
            title: "Ovqat turini tanlang",
            description: "Rejadagi ovqat vaqtini tanlang.",
            options: MEAL_TYPE_OPTIONS,
            value: planMealType,
            onSelect: setPlanMealType,
          }
        : picker === "plan"
          ? {
              title: "Reja tanlang",
              description: "Retsept qo'shiladigan rejani tanlang.",
              options: planOptions,
              value: resolvedPlanId,
              onSelect: setPlanId,
            }
          : picker === "day"
            ? {
                title: "Kunni tanlang",
                description: "Retsept qaysi kunga qo'shiladi?",
                options: dayOptions,
                value: resolvedDayKey,
                onSelect: setDayKey,
              }
            : null;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-lg">
          <DrawerHeader className="border-b border-border/40">
            <DrawerTitle>Rejaga qo'shish</DrawerTitle>
            <DrawerDescription>
              {recipe.title} uchun vaqt va porsiyani tanlang.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="px-4 pb-4">
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid h-10 w-full grid-cols-2">
                <TabsTrigger value="log" onClick={() => setMode("log")}>
                  Ovqat jurnali
                </TabsTrigger>
                <TabsTrigger value="plan" onClick={() => setMode("plan")}>
                  Reja
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-4 flex flex-col gap-3" value="log">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Sana
                  <div className="relative">
                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={date}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setDuplicatePayload(null);
                      }}
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Vaqt
                  <Input
                    type="time"
                    aria-label="Ovqat vaqti"
                    value={time}
                    onChange={(event) => {
                      setTime(event.target.value);
                      setDuplicatePayload(null);
                    }}
                  />
                </label>
                <SelectionButton
                  label="Ovqat vaqti"
                  valueLabel={mealTypeLabel}
                  onClick={() => setPicker("meal")}
                />
                <ServingsStepper value={servings} onChange={setServings} />
                <NutritionPreview recipe={recipe} servings={servings} />
                {duplicatePayload ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Bu retsept shu sana va ovqat vaqtida bor. Baribir qo'shish
                    uchun tasdiqlash tugmasini bosing.
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent className="mt-4 flex flex-col gap-3" value="plan">
                <SelectionButton
                  label="Reja"
                  valueLabel={planLabel}
                  disabled={isLoading || !planOptions.length}
                  onClick={() => setPicker("plan")}
                />
                <SelectionButton
              label="Kun"
              valueLabel={dayLabel}
                  disabled={!resolvedPlanId || !dayOptions.length}
              onClick={() => setPicker("day")}
            />
                <SelectionButton
                  label="Ovqat vaqti"
                  valueLabel={planMealTypeLabel}
                  onClick={() => setPicker("planMeal")}
                />
                <ServingsStepper value={servings} onChange={setServings} />
                <NutritionPreview recipe={recipe} servings={servings} />
                {planConflictMessage ? (
                  <Badge variant="outline" className="justify-center">
                    {planConflictMessage}
                  </Badge>
                ) : null}
                {!isLoading && !planOptions.length ? (
                  <Badge variant="outline" className="justify-center">
                    Avval reja yarating
                  </Badge>
                ) : null}
              </TabsContent>
            </Tabs>
          </DrawerBody>
          <DrawerFooter className="border-t border-border/40 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {mode === "log" && duplicatePayload ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleLogSubmit(true)}
              >
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                Baribir qo'shish
              </Button>
            ) : (
              <Button
                type="button"
                disabled={
                  isSubmitting ||
                  (mode === "plan" &&
                    (!resolvedPlanId || Boolean(planConflictMessage)))
                }
                onClick={() =>
                  mode === "log" ? handleLogSubmit(false) : handlePlanSubmit()
                }
              >
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                Qo'shish
              </Button>
            )}
            <Button type="button" variant="outline" onClick={closeDrawer}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {activePicker ? (
        <OptionPickerDrawer
          open={Boolean(activePicker)}
          onOpenChange={(nextOpen) => !nextOpen && setPicker(null)}
          {...activePicker}
        />
      ) : null}
    </>
  );
};

export default RecipeAddDrawer;
