import React from "react";
import { filter, round } from "lodash";
import {
  SparklesIcon,
  ScaleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const WEEK_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const MEALS_3 = [
  { type: "Nonushta", time: "08:00-09:00", ratio: 0.3 },
  { type: "Tushlik", time: "13:00-14:00", ratio: 0.4 },
  { type: "Kechki ovqat", time: "19:00-20:00", ratio: 0.3 },
];

const MEALS_5 = [
  { type: "Nonushta", time: "08:00-09:00", ratio: 0.25 },
  { type: "1-chi gazak", time: "11:00-11:30", ratio: 0.1 },
  { type: "Tushlik", time: "13:00-14:00", ratio: 0.35 },
  { type: "2-chi gazak", time: "17:00-17:30", ratio: 0.1 },
  { type: "Kechki ovqat", time: "19:00-20:00", ratio: 0.2 },
];

const GOALS = [
  {
    value: "loss",
    label: "Ozish",
    icon: TrendingDownIcon,
    defaultCal: 1600,
    macros: { p: 0.4, c: 0.3, f: 0.3 },
  },
  {
    value: "maintain",
    label: "Saqlanish",
    icon: ScaleIcon,
    defaultCal: 2100,
    macros: { p: 0.25, c: 0.45, f: 0.3 },
  },
  {
    value: "gain",
    label: "Mushak oshirish",
    icon: TrendingUpIcon,
    defaultCal: 2800,
    macros: { p: 0.35, c: 0.45, f: 0.2 },
  },
];

const makeId = () => `col-${Math.random().toString(36).slice(2, 9)}`;

const pickFoodsForMeal = (pool, targetCal, dayIdx, mealIdx) => {
  if (!pool.length) return [];

  const offset = (dayIdx * 5 + mealIdx * 3) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];

  const picked = [];
  let cumCal = 0;

  for (const food of rotated) {
    if (picked.length >= 4) break;
    if (cumCal >= targetCal * 0.88) break;

    const baseCal = food.baseCal || food.cal || 0;
    if (baseCal <= 0) continue;

    const step = food.step || 10;
    const defaultAmount = food.defaultAmount || 100;
    const remaining = targetCal - cumCal;
    const portion = picked.length === 0 ? remaining * 0.6 : remaining * 0.4;
    const isGramBased = !food.unit || food.unit === "g" || food.unit === "ml";
    const rawGrams = isGramBased
      ? round((portion / baseCal) * 100 / step) * step
      : round((portion / baseCal) * defaultAmount / step) * step;
    const grams = Math.max(step, Math.min(500, rawGrams || step));

    const factor = isGramBased ? grams / 100 : grams / defaultAmount;

    picked.push({
      ...food,
      grams,
      cal: round(baseCal * factor),
      protein: round((food.baseProtein || food.protein || 0) * factor),
      carbs: round((food.baseCarbs || food.carbs || 0) * factor),
      fat: round((food.baseFat || food.fat || 0) * factor),
    });

    cumCal += round(baseCal * factor);
  }

  return picked;
};

const generateWeeklyKanban = (foods, goal, targetCal, mealsPerDay) => {
  const mealTemplates = mealsPerDay === 5 ? MEALS_5 : MEALS_3;

  const proteinFoods = filter(
    foods,
    (f) => (f.baseProtein || f.protein || 0) >= 12,
  );

  const breakfastPool = proteinFoods.length ? proteinFoods : foods;
  const lunchPool = foods.length ? foods : proteinFoods;
  const dinnerPool = proteinFoods.length ? proteinFoods : foods;
  const snackPool = filter(foods, (f) => (f.baseCal || f.cal || 0) < 200);

  const getPool = (mealType) => {
    if (mealType === "Nonushta") return breakfastPool;
    if (mealType === "Tushlik") return lunchPool;
    if (mealType === "Kechki ovqat") return dinnerPool;
    return snackPool.length ? snackPool : foods;
  };

  const kanban = {};

  WEEK_DAYS.forEach((day, dayIdx) => {
    kanban[day] = mealTemplates.map((meal, mealIdx) => ({
      id: makeId(),
      type: meal.type,
      time: meal.time,
      items: pickFoodsForMeal(
        getPool(meal.type),
        round(targetCal * meal.ratio),
        dayIdx,
        mealIdx,
      ),
    }));
  });

  return kanban;
};

const AiGeneratorDrawer = ({ open, onOpenChange, foods = [], onGenerate }) => {
  const [goal, setGoal] = React.useState("maintain");
  const [calories, setCalories] = React.useState(2100);
  const [mealsPerDay, setMealsPerDay] = React.useState(3);
  const [generating, setGenerating] = React.useState(false);

  const selectedGoal = GOALS.find((g) => g.value === goal);

  const handleGoalChange = React.useCallback((val) => {
    setGoal(val);
    const g = GOALS.find((x) => x.value === val);
    if (g) setCalories(g.defaultCal);
  }, []);

  const handleGenerate = React.useCallback(async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const kanban = generateWeeklyKanban(foods, goal, calories, mealsPerDay);
    setGenerating(false);
    onGenerate(kanban);
  }, [foods, goal, calories, mealsPerDay, onGenerate]);

  const macros = selectedGoal
    ? {
        protein: round((calories * selectedGoal.macros.p) / 4),
        carbs: round((calories * selectedGoal.macros.c) / 4),
        fat: round((calories * selectedGoal.macros.f) / 9),
      }
    : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
        <DrawerHeader className="px-6 pb-2 pt-5 text-left">
          <DrawerTitle className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10">
              <SparklesIcon className="size-4 text-violet-500" />
            </div>
            AI Ovqatlanish Rejasi
          </DrawerTitle>
          <DrawerDescription>
            Parametrlarni kiriting — AI haftalik reja yaratib beradi
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 px-6 py-4">
          {/* Goal selector */}
          <div className="space-y-2">
            <Label>Maqsad</Label>
            <div className="grid grid-cols-3 gap-2">
              {GOALS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleGoalChange(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all",
                    goal === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-[11px] font-semibold leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Calories slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Kunlik kaloriya</Label>
              <span className="tabular-nums text-sm font-bold text-primary">
                {calories} kcal
              </span>
            </div>
            <Slider
              min={1200}
              max={4000}
              step={50}
              value={[calories]}
              onValueChange={([val]) => setCalories(val)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1200 kcal</span>
              <span>4000 kcal</span>
            </div>
          </div>

          {/* Meals per day */}
          <div className="space-y-2">
            <Label>Kunlik ovqatlar soni</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { n: 3, desc: "Asosiy" },
                { n: 5, desc: "+ gazaklar" },
              ].map(({ n, desc }) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMealsPerDay(n)}
                  className={cn(
                    "rounded-2xl border px-4 py-2.5 text-left transition-all",
                    mealsPerDay === n
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  <p className="text-sm font-bold">{n} marta</p>
                  <p className="text-[11px] opacity-70">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Macro preview */}
          {macros && (
            <div className="rounded-2xl bg-muted/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Taxminiy makrolar
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-blue-500">
                    {macros.protein}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Oqsil</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-500">
                    {macros.carbs}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Uglerod</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-500">
                    {macros.fat}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Yog'</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="px-6 py-4">
          <Button
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <SparklesIcon className="mr-2 size-4 animate-pulse" />
                Reja yaratilmoqda...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 size-4" />
                Haftalik reja yaratish
              </>
            )}
          </Button>
          {!foods.length && !generating && (
            <p className="text-center text-[11px] text-muted-foreground">
              Ovqatlar katalogi yuklanmoqda...
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AiGeneratorDrawer;
