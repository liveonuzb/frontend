import React from "react";
import round from "lodash/round";
import find from "lodash/find";
import map from "lodash/map";
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
import {
  generateWeeklyKanban,
  WEEK_DAYS,
} from "@/components/meal-plan-builder/ai-generator-drawer-utils";

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

const AiGeneratorDrawer = ({
  open,
  onOpenChange,
  foods = [],
  onGenerate,
  dayCount = WEEK_DAYS.length,
}) => {
  const [goal, setGoal] = React.useState("maintain");
  const [calories, setCalories] = React.useState(2100);
  const [mealsPerDay, setMealsPerDay] = React.useState(3);
  const [generating, setGenerating] = React.useState(false);

  const selectedGoal = find(GOALS, (g) => g.value === goal);

  const handleGoalChange = React.useCallback((val) => {
    setGoal(val);
    const g = find(GOALS, (x) => x.value === val);
    if (g) setCalories(g.defaultCal);
  }, []);

  const handleGenerate = React.useCallback(async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const kanban = generateWeeklyKanban(
      foods,
      goal,
      calories,
      mealsPerDay,
      dayCount,
    );
    setGenerating(false);
    onGenerate(kanban);
  }, [foods, goal, calories, mealsPerDay, onGenerate, dayCount]);

  const macros = selectedGoal
    ? {
        protein: round((calories * selectedGoal.macros.p) / 4),
        carbs: round((calories * selectedGoal.macros.c) / 4),
        fat: round((calories * selectedGoal.macros.f) / 9),
      }
    : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="px-6 pb-2 pt-5 text-left">
          <DrawerTitle className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10">
              <SparklesIcon className="size-4 text-violet-500" />
            </div>
            AI Ovqatlanish Rejasi
          </DrawerTitle>
          <DrawerDescription>
            Parametrlarni kiriting — AI{" "}
            {dayCount > 7 ? `${dayCount} kunlik` : "haftalik"} reja yaratib
            beradi
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 px-6 py-4">
          {/* Goal selector */}
          <div className="space-y-2">
            <Label>Maqsad</Label>
            <div className="grid grid-cols-3 gap-2">
              {map(GOALS, ({ value, label, icon: Icon }) => (
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
              {map(
                [
                  { n: 3, desc: "Asosiy" },
                  { n: 5, desc: "+ gazaklar" },
                ],
                ({ n, desc }) => (
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
                ),
              )}
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
                {dayCount > 7 ? `${dayCount} kunlik` : "Haftalik"} reja yaratish
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
