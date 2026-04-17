import React from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddMealOverlayStore } from "@/store";
import {
  ArrowRightIcon,
  FlameIcon,
  PlusIcon,
  UtensilsIcon,
} from "lucide-react";
import { get, map, entries, reduce } from "lodash";

const mealTypeConfig = {
  breakfast: { label: "Nonushta", icon: "🍳", time: "08:00" },
  lunch: { label: "Tushlik", icon: "🥗", time: "13:00" },
  dinner: { label: "Kechki ovqat", icon: "🍲", time: "19:00" },
  snack: { label: "Snack", icon: "🥜", time: "16:00" },
};

const mealPctGoal = {
  breakfast: 0.3,
  lunch: 0.35,
  dinner: 0.25,
  snack: 0.1,
};

export default function MealsWidget({
  isEditMode,
  dayData,
  goals,
  onOpen,
  onAddMeal,
  showQuickAdd = true,
}) {
  const navigate = useNavigate();
  const openActionDrawer = useAddMealOverlayStore(
    (state) => state.openActionDrawer,
  );
  const dateKey = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    [],
  );

  return (
    <Card className="py-6 h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UtensilsIcon className="size-4 text-orange-500" />
            Ovqatlar
          </CardTitle>
          <button
            className="size-8 bg-muted hover:bg-muted/80 rounded-md flex items-center justify-center transition-colors"
            onClick={() =>
              !isEditMode && (onOpen ? onOpen() : navigate("/user/nutrition"))
            }
          >
            <ArrowRightIcon className="size-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-y-5">
        {map(entries(mealTypeConfig), ([type="", config={}]) => {
          const foods = get(dayData, ["meals", type], []);
          const cal = reduce(
            foods,
            (s, f) => s + get(f, "cal", 0) * get(f, "qty", 1),
            0,
          );
          const mealGoal = Math.round(
            get(goals, "calories", 0) * get(mealPctGoal, type, 0.25),
          );
          const pct = mealGoal > 0 ? Math.min(cal / mealGoal, 1) : 0;

          const ringSize = 48;
          const ringR = 19;
          const ringStroke = 3;
          const circumference = 2 * Math.PI * ringR;
          const dashOffset = circumference * (1 - pct);

          return (
            <div
              key={type}
              className="flex items-center gap-3 py-1 cursor-pointer group/meal"
              onClick={() =>
                !isEditMode && (onOpen ? onOpen() : navigate("/user/nutrition"))
              }
            >
              <div
                className="relative shrink-0"
                style={{ width: ringSize, height: ringSize }}
              >
                <svg
                  width={ringSize}
                  height={ringSize}
                  className="rotate-[-90deg]"
                >
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringR}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/30"
                    strokeWidth={ringStroke}
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringR}
                    fill="none"
                    stroke="url(#mealRingGrad)"
                    strokeWidth={ringStroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient
                      id="mealRingGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#a3e635" />
                      <stop offset="100%" stopColor="#65a30d" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl">
                  {get(config, "icon")}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{get(config, "label")}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <FlameIcon className="size-3 text-orange-400" />
                  {cal > 0 ? `${cal} kcal` : "0 kcal"}
                </p>
              </div>

              {showQuickAdd ? (
                <button
                  className="size-11 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors shrink-0 group-hover/meal:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditMode) return;
                    if (onAddMeal) {
                      onAddMeal(type);
                      return;
                    }
                    openActionDrawer({ mealType: type, dateKey });
                  }}
                >
                  <PlusIcon className="size-4 text-muted-foreground group-hover/meal:text-primary transition-colors" />
                </button>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
