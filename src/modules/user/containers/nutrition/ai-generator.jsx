import React, { useMemo, useState } from "react";
import { find } from "lodash";
import { Button } from "@/components/ui/button";
import {
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MEAL_PLAN_GOALS } from "@/data/meal-plans.mock";
import { ChevronLeftIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useMealPlan from "@/hooks/app/use-meal-plan";

const MEAL_COUNTS = [
  { id: 3, label: "3 mahal", description: "Nonushta, Tushlik, Kechki ovqat" },
  { id: 4, label: "4 mahal", description: "3 mahal + 1 snack" },
  { id: 5, label: "5 mahal", description: "3 mahal + 2 snack" },
];

const AIGenerator = ({ onClose, onGenerated }) => {
  const { generateAiPlan, isGeneratingAi } = useMealPlan();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedMealCount, setSelectedMealCount] = useState(4);

  const selectedGoalData = useMemo(
    () => find(MEAL_PLAN_GOALS, { id: selectedGoal }) ?? null,
    [selectedGoal],
  );

  const handleAiGenerate = async () => {
    if (!selectedGoal) {
      return;
    }

    try {
      const nextState = await generateAiPlan({
        goal: selectedGoal,
        mealCount: selectedMealCount,
      });

      if (nextState?.draftPlan && onGenerated) {
        onGenerated(nextState.draftPlan);
      }

      onClose();
      toast.success("AI reja yaratildi!", {
        description: "Reja real ovqatlar bazasi asosida tuzildi.",
        icon: <SparklesIcon className="size-4 text-primary" />,
      });
    } catch {
      toast.error("AI rejani yaratib bo'lmadi");
    }
  };

  return (
    <>
      <DrawerHeader className="relative">
        {step > 1 ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeftIcon className="size-5" />
          </Button>
        ) : null}
        <div className="w-full px-10 text-center">
          <DrawerTitle>AI Smart Plan</DrawerTitle>
          <DrawerDescription>
            {step === 1
              ? "Maqsadingizni tanlang"
              : "Kuniga necha mahal ovqatlanasiz?"}
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody className="space-y-3">
        {step === 1 ? (
          <div className="space-y-2">
            {MEAL_PLAN_GOALS.map((goal) => {
              const isActive = selectedGoal === goal.id;

              return (
                <button
                  key={goal.id}
                  onClick={() => {
                    setSelectedGoal(goal.id);
                    setStep(2);
                  }}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    "flex items-center gap-3",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isActive
                        ? "border-primary"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isActive ? (
                      <div className="size-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <span className="shrink-0 text-2xl">{goal.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-sm font-semibold leading-none">
                      {goal.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {goal.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary bg-primary/5 p-3">
              <span className="shrink-0 text-2xl">
                {selectedGoalData?.emoji}
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">
                  {selectedGoalData?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedGoalData?.intensity} • real ovqatlar bazasi asosida
                </p>
              </div>
            </div>

            {MEAL_COUNTS.map((count) => {
              const isActive = selectedMealCount === count.id;

              return (
                <button
                  key={count.id}
                  onClick={() => setSelectedMealCount(count.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    "flex items-center gap-3",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isActive
                        ? "border-primary"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isActive ? (
                      <div className="size-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{count.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {count.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DrawerBody>

      <DrawerFooter>
        {step === 2 ? (
          <Button onClick={handleAiGenerate} disabled={isGeneratingAi}>
            {isGeneratingAi ? (
              <>
                <Loader2Icon className="mr-2 size-5 animate-spin" />
                Reja tuzilmoqda...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 size-5" />
                Rejani yaratish
              </>
            )}
          </Button>
        ) : null}
        <Button variant="outline" onClick={onClose} disabled={isGeneratingAi}>
          Bekor qilish
        </Button>
      </DrawerFooter>
    </>
  );
};

export default AIGenerator;
