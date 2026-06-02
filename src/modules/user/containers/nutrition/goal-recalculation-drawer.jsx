import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon, TargetIcon } from "lucide-react";
import { toast } from "sonner";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useMe from "@/hooks/app/use-me";
import { calculateGoals } from "@/lib/goal-calculator";
import {
  NutritionDrawerBody,
  NutritionDrawerContent,
} from "./nutrition-drawer-layout.jsx";

import map from "lodash/map";
import lodashToNumber from "lodash/toNumber";

const STEPS = [
  "Joriy vazn",
  "Maqsadli vazn",
  "Faollik darajasi",
  "Ovqatlanish uslubi",
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Kam harakat" },
  { value: "lightly-active", label: "Yengil faol" },
  { value: "moderately-active", label: "O'rtacha faol" },
  { value: "very-active", label: "Juda faol" },
  { value: "extra-active", label: "Sportchi rejimi" },
];

const EATING_STYLE_OPTIONS = [
  { value: "balanced", label: "Balanslangan" },
  { value: "high-protein", label: "Oqsil ko'proq" },
  { value: "lower-carb", label: "Uglevod kamroq" },
  { value: "plant-forward", label: "O'simlikka yaqin" },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const roundToStep = (value, step) => Math.round(value / step) * step;

const toNumber = (value, fallback) => {
  const number = lodashToNumber(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

const resolveGoal = (currentWeight, targetWeight) => {
  const diff = targetWeight - currentWeight;
  if (diff <= -0.5) return "lose";
  if (diff >= 0.5) return "gain";
  return "maintain";
};

const applyEatingStyle = (goals, style, currentWeight) => {
  const calories = goals.calories;
  const baseProtein = goals.protein;
  const baseFat = goals.fat;

  if (style === "high-protein") {
    const protein = Math.max(baseProtein, Math.round(currentWeight * 2.2));
    const fat = baseFat;
    return {
      ...goals,
      protein,
      fat,
      carbs: Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4)),
    };
  }

  if (style === "lower-carb") {
    const protein = baseProtein;
    const carbs = Math.max(60, Math.round(goals.carbs * 0.65));
    return {
      ...goals,
      protein,
      carbs,
      fat: Math.max(35, Math.round((calories - protein * 4 - carbs * 4) / 9)),
    };
  }

  if (style === "plant-forward") {
    const protein = Math.max(Math.round(currentWeight * 1.7), baseProtein - 15);
    const fat = Math.max(40, Math.round(baseFat * 0.9));
    return {
      ...goals,
      protein,
      fat,
      fiber: 38,
      carbs: Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4)),
    };
  }

  return goals;
};

export default function GoalRecalculationDrawer({ open, onOpenChange }) {
  const { onboarding } = useMe();
  const { goals, saveGoals, isSaving } = useHealthGoals({ enabled: open });
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    currentWeight: "70",
    targetWeight: "70",
    activityLevel: "moderately-active",
    eatingStyle: "balanced",
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!open) return;

    const currentWeight = toNumber(onboarding?.currentWeight?.value, 70);
    const targetWeight = toNumber(
      onboarding?.targetWeight?.value,
      currentWeight,
    );

    setStep(0);
    setForm({
      currentWeight: String(currentWeight),
      targetWeight: String(targetWeight),
      activityLevel: onboarding?.activityLevel || "moderately-active",
      eatingStyle: "balanced",
    });
  }, [onboarding, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const recommendation = React.useMemo(() => {
    const currentWeight = toNumber(form.currentWeight, 70);
    const targetWeight = toNumber(form.targetWeight, currentWeight);
    const goal = resolveGoal(currentWeight, targetWeight);
    const weeklyPace =
      goal === "maintain"
        ? 0.25
        : clamp(Math.abs(targetWeight - currentWeight) / 12, 0.25, 1);
    const calculated = calculateGoals({
      gender: onboarding?.gender || "male",
      age: onboarding?.age || 25,
      heightValue: toNumber(onboarding?.height?.value, 175),
      currentWeightValue: currentWeight,
      goal,
      activityLevel: form.activityLevel,
      weeklyPace,
    });

    return {
      ...applyEatingStyle(calculated, form.eatingStyle, currentWeight),
      goal,
      weeklyPace,
    };
  }, [form, onboarding]);

  const updateForm = React.useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const canGoNext =
    step < STEPS.length - 1 &&
    (step !== 0 || toNumber(form.currentWeight, 0) > 0) &&
    (step !== 1 || toNumber(form.targetWeight, 0) > 0);

  const handleApply = React.useCallback(async () => {
    try {
      await saveGoals({
        goal: recommendation.goal,
        calories: roundToStep(recommendation.calories, 25),
        protein: recommendation.protein,
        carbs: recommendation.carbs,
        fat: recommendation.fat,
        fiber: recommendation.fiber,
        waterMl: recommendation.waterMl,
        steps: recommendation.steps,
        sleepHours: recommendation.sleepHours,
        workoutMinutes: recommendation.workoutMinutes,
        weightUnit: goals.weightUnit || "kg",
        heightUnit: goals.heightUnit || "cm",
      });
      toast.success("Maqsadlar yangilandi");
      onOpenChange(false);
    } catch {
      toast.error("Maqsadlarni yangilab bo'lmadi");
    }
  }, [goals.heightUnit, goals.weightUnit, onOpenChange, recommendation, saveGoals]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="sm">
        <DrawerHeader>
          <DrawerTitle>Maqsadimni yangilash</DrawerTitle>
          <DrawerDescription>
            Yangi vazn va faollikka mos kaloriya nishonini hisoblang
          </DrawerDescription>
        </DrawerHeader>

        <NutritionDrawerBody className="space-y-5 pb-5">
          <div className="grid grid-cols-4 gap-2">
            {map(STEPS, (label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`h-2 rounded-full transition-colors ${
                  index <= step ? "bg-primary" : "bg-muted"
                }`}
                aria-label={label}
              />
            ))}
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">
              {step + 1}/4
            </p>
            <h3 className="mt-1 text-lg font-black">{STEPS[step]}</h3>
          </div>

          {step === 0 ? (
            <div className="space-y-2">
              <Input
                type="number"
                inputMode="decimal"
                min="1"
                value={form.currentWeight}
                onChange={(event) =>
                  updateForm("currentWeight", event.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">Kilogrammda</p>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-2">
              <Input
                type="number"
                inputMode="decimal"
                min="1"
                value={form.targetWeight}
                onChange={(event) =>
                  updateForm("targetWeight", event.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Target joriy vazndan past bo'lsa vazn yo'qotish, yuqori bo'lsa
                mushak/vazn olish hisoblanadi.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <Select
              value={form.activityLevel}
              onValueChange={(value) => updateForm("activityLevel", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Faollik darajasi" />
              </SelectTrigger>
              <SelectContent>
                {map(ACTIVITY_OPTIONS, (option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <Select
                value={form.eatingStyle}
                onValueChange={(value) => updateForm("eatingStyle", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ovqatlanish uslubi" />
                </SelectTrigger>
                <SelectContent>
                  {map(EATING_STYLE_OPTIONS, (option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <TargetIcon className="size-4 text-primary" />
                  Siz uchun {roundToStep(recommendation.calories, 25)} kcal/kun
                  tavsiya qilinadi
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-background px-2 py-3">
                    <p className="font-black">{recommendation.protein}g</p>
                    <p className="text-muted-foreground">Oqsil</p>
                  </div>
                  <div className="rounded-xl bg-background px-2 py-3">
                    <p className="font-black">{recommendation.carbs}g</p>
                    <p className="text-muted-foreground">Uglevod</p>
                  </div>
                  <div className="rounded-xl bg-background px-2 py-3">
                    <p className="font-black">{recommendation.fat}g</p>
                    <p className="text-muted-foreground">Yog'</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </NutritionDrawerBody>

        <DrawerFooter>
          <div className={step > 0 ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeftIcon className="size-4" />
                Ortga
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext}
              >
                Keyingi
                <ChevronRightIcon className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleApply} disabled={isSaving}>
                Qo'llash
              </Button>
            )}
          </div>
          {step === STEPS.length - 1 ? (
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              Tahrirlash
            </Button>
          ) : null}
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
