import React, { memo, useState } from "react";
import { motion } from "framer-motion";
import { get, round, multiply } from "lodash";
import { cn } from "@/lib/utils.js";
import { CheckIcon, XIcon, InfoIcon } from "lucide-react";
import FoodLogDrawer from "./food-log-drawer.jsx";
import PortionEditorDrawer from "./portion-editor-drawer.jsx";
import CameraLogDrawer from "./camera-log-drawer.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { getNutritionSourceMeta } from "./source-meta.js";

const MACROS = [
  { key: "protein", color: "bg-red-400" },
  { key: "carbs", color: "bg-amber-400" },
  { key: "fat", color: "bg-blue-400" },
];

const MealCard = memo(
  ({
    food,
    index,
    mealType,
    isFromPlan,
    onRemove,
    onTogglePlanned,
    onLogPlanned,
    onSaveImage,
    readOnly = false,
  }) => {
    const [logOpen, setLogOpen] = useState(false);
    const [portionOpen, setPortionOpen] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);

    const isConsumed = get(food, "isConsumed", false);
    const qty = get(food, "qty", 1);
    const cal = get(food, "cal", 0);
    const grams = get(food, "grams", null);
    const defaultAmount = get(food, "defaultAmount", null);
    const unit = get(food, "unit", "g");
    const totalCal = round(multiply(cal, qty));
    const emoji = get(food, "emoji", "🍽️");
    const image = get(food, "image", null);
    const sourceMeta = getNutritionSourceMeta(
      get(food, "source", null),
      get(food, "isFromPlanLinked", false) ? "meal-plan" : "manual",
    );

    const isOverConsumed =
      isConsumed &&
      grams != null &&
      defaultAmount != null &&
      grams > defaultAmount;

    const handleEat = () => {
      if (readOnly) return;

      if (isConsumed) {
        onRemove(mealType, food);
      } else {
        setPortionOpen(true);
      }
    };

    const handleOpenDetails = () => {
      if (!isConsumed) return;
      setLogOpen(true);
    };

    const handlePortionConfirm = (portionGrams, macros) => {
      if (readOnly) return;

      if (!isConsumed) {
        onLogPlanned?.(mealType, food, {
          grams: portionGrams,
          macros,
          image: null,
        });
        return;
      }

      onSaveImage(mealType, food, null, portionGrams, macros);
    };

    const handleCameraSave = (dataUrl, portionGrams, macros) => {
      if (readOnly) return;

      if (!isConsumed) {
        onLogPlanned?.(mealType, food, {
          grams: portionGrams,
          macros,
          image: dataUrl,
        });
        return;
      }

      onSaveImage(mealType, food, dataUrl, portionGrams, macros);
    };

    return (
      <>
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, height: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <Card
            className={cn(
              "relative overflow-hidden transition-all duration-300",
              isConsumed && "cursor-pointer",
              !isConsumed && "bg-muted/30 border-border/50",
              isConsumed &&
                !isOverConsumed &&
                "bg-green-500/5 border-green-500/30 shadow-sm shadow-green-500/10",
              isConsumed &&
                isOverConsumed &&
                "bg-red-500/5 border-red-500/30 shadow-sm shadow-red-500/10",
            )}
            onClick={handleOpenDetails}
          >
            <CardContent className="flex items-stretch p-0">
              {/* Avatar */}
              <div
                className={cn(
                  "relative shrink-0 size-24 md:size-24  overflow-hidden flex items-center justify-center border-r transition-all duration-300",
                  isConsumed && !isOverConsumed
                    ? "border-green-500/20 bg-green-500/10"
                    : isConsumed && isOverConsumed
                      ? "border-red-500/20 bg-red-500/10"
                      : "border-border/30 bg-muted/40",
                )}
              >
                {image ? (
                  <img
                    src={image}
                    alt={food.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl leading-none">{emoji}</span>
                )}

                {isConsumed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "absolute inset-0 flex items-center justify-center",
                      isOverConsumed ? "bg-red-500/20" : "bg-green-500/20",
                    )}
                  >
                    <div
                      className={cn(
                        "size-5 rounded-full flex items-center justify-center",
                        isOverConsumed ? "bg-red-500" : "bg-green-500",
                      )}
                    >
                      <CheckIcon className="size-3 text-white stroke-[3]" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center gap-0.5">
                <p
                  className={cn(
                    "text-[13px] font-bold truncate leading-snug",
                    isConsumed ? "text-foreground" : "text-foreground/80",
                  )}
                >
                  {food.name}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold",
                      sourceMeta.tone,
                    )}
                  >
                    {sourceMeta.label}
                  </span>
                  {grams != null && (
                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-bold rounded px-1 py-0.5",
                        isConsumed
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {grams}
                      {unit}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {MACROS.map(({ key, color }) => (
                      <span
                        key={key}
                        className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground"
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0",
                            color,
                          )}
                        />
                        <span className="tabular-nums">
                          {get(food, key, 0)}g
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: kcal + action button */}
              <div className="shrink-0 flex flex-col items-end justify-center gap-2 px-3 py-2.5 border-l border-border/20">
                <span
                  className={cn(
                    "text-[15px] font-black tabular-nums leading-none whitespace-nowrap",
                    isOverConsumed
                      ? "text-red-500"
                      : isConsumed
                        ? "text-green-600 dark:text-green-400"
                        : "text-foreground/70",
                  )}
                >
                  {totalCal}
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase ml-0.5",
                      isOverConsumed
                        ? "text-red-400"
                        : isConsumed
                          ? "text-green-500/70"
                          : "text-muted-foreground/60",
                    )}
                  >
                    kcal
                  </span>
                </span>

                {/* Plan item: check (not logged) → info (logged, green) */}
                {isFromPlan && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      if (readOnly && !isConsumed) return;
                      setLogOpen(true);
                    }}
                    className={cn(
                      "size-9 rounded-full flex items-center justify-center transition-all duration-200",
                      isConsumed || readOnly
                        ? "bg-green-500 text-white hover:bg-green-600 shadow-sm shadow-green-500/30"
                        : "border border-border/60 text-muted-foreground/60 hover:border-green-500/50 hover:text-green-600 hover:bg-green-500/10",
                    )}
                    aria-label={
                      isConsumed || readOnly ? "Ma'lumot" : "Log qilish"
                    }
                  >
                    {isConsumed || readOnly ? (
                      <InfoIcon className="size-4" />
                    ) : (
                      <CheckIcon className="size-4 stroke-[2.5]" />
                    )}
                  </button>
                )}

                {isConsumed && !isFromPlan && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setLogOpen(true);
                    }}
                    className={cn(
                      "size-9 rounded-full flex items-center justify-center transition-all duration-200",
                      isOverConsumed
                        ? "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/30"
                        : "bg-green-500 text-white hover:bg-green-600 shadow-sm shadow-green-500/30",
                    )}
                    aria-label="Ma'lumot"
                  >
                    <InfoIcon className="size-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <FoodLogDrawer
          food={food}
          mealType={mealType}
          open={logOpen}
          onClose={() => setLogOpen(false)}
          onEat={readOnly ? undefined : handleEat}
          onCamera={readOnly ? undefined : () => setCameraOpen(true)}
          onEditPortion={
            readOnly
              ? undefined
              : isConsumed
                ? () => setPortionOpen(true)
                : undefined
          }
          readOnly={readOnly}
        />

        <PortionEditorDrawer
          food={food}
          open={portionOpen}
          onClose={() => setPortionOpen(false)}
          onConfirm={handlePortionConfirm}
        />

        <CameraLogDrawer
          food={food}
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onSave={handleCameraSave}
        />
      </>
    );
  },
);

MealCard.displayName = "MealCard";
export default MealCard;
