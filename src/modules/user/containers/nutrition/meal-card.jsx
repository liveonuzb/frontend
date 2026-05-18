import React, { memo, useState } from "react";
import { motion } from "framer-motion";
import { get, round, multiply, includes, isArray, map } from "lodash";
import { cn } from "@/lib/utils.js";
import {
  CheckCircle2Icon,
  CheckIcon,
  InfoIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import FoodLogDrawer from "./food-log-drawer.jsx";
import PortionEditorDrawer from "./portion-editor-drawer.jsx";
import CameraLogDrawer from "./camera-log-drawer.jsx";
import MealIngredientsEditorDrawer from "./meal-ingredients-editor-drawer.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
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
    onUpdateLoggedMeal,
    onRetryScan,
    onRemoveScan,
    onOpenDraftScan,
    onTransferMeal,
    onCopyMealToToday,
    readOnly = false,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelect,
    onEnterSelectionMode,
  }) => {
    const [logOpen, setLogOpen] = useState(false);
    const [portionOpen, setPortionOpen] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [ingredientsOpen, setIngredientsOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const isConsumed = get(food, "isConsumed", false);
    const qty = get(food, "qty", 1);
    const cal = get(food, "cal", 0);
    const grams = get(food, "grams", null);
    const defaultAmount = get(food, "defaultAmount", null);
    const unit = get(food, "unit", "g");
    const totalCal = round(multiply(cal, qty));
    const emoji = get(food, "emoji", "🍽️");
    const image = get(food, "image", null);
    const ingredients = get(food, "ingredients", []);
    const hasIngredientBreakdown =
      isArray(ingredients) && ingredients.length > 0;
    const sourceMeta = getNutritionSourceMeta(
      get(food, "source", null),
      get(food, "isFromPlanLinked", false) ? "meal-plan" : "manual",
    );
    const scanStatus = get(food, "status", null);
    const canSelect = isConsumed && !readOnly;
    const longPressTimerRef = React.useRef(null);
    const longPressTriggeredRef = React.useRef(false);

    React.useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current);
        }
      };
    }, []);

    if (includes(["scanning", "draft", "error"], scanStatus)) {
      const scanImage = get(food, "image", null);
      const scanTitle =
        scanStatus === "scanning"
          ? "AI tahlil qilmoqda..."
          : scanStatus === "error"
            ? "Tahlil qilib bo'lmadi"
            : food.name || "AI topgan ovqat";

      return (
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
              scanStatus === "draft" &&
                "cursor-pointer border-emerald-500/30 bg-emerald-500/5",
              scanStatus === "scanning" && "border-primary/25 bg-primary/5",
              scanStatus === "error" && "border-destructive/30 bg-destructive/5",
            )}
            onClick={() => scanStatus === "draft" && onOpenDraftScan?.(food)}
          >
            <CardContent className="flex items-stretch p-0">
              <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden border-r bg-muted/40">
                {scanImage ? (
                  <img
                    loading="lazy"
                    src={scanImage}
                    alt={scanTitle}
                    className={cn(
                      "size-full object-cover",
                      scanStatus === "scanning" && "opacity-70 blur-[1px]",
                    )}
                  />
                ) : (
                  <span className="text-xl leading-none">🍽️</span>
                )}
                {scanStatus === "scanning" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/35">
                    <Loader2Icon className="size-5 animate-spin text-primary" />
                  </div>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
                {scanStatus === "scanning" ? (
                  <>
                    <Skeleton className="h-4 w-2/3 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    <div className="flex gap-1.5 pt-1">
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="truncate text-[13px] font-bold leading-snug">
                      {scanTitle}
                    </p>
                    {scanStatus === "draft" ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2Icon className="size-3" />
                          Tayyor — tekshiring
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          P {food.protein || 0}g · C {food.carbs || 0}g · F{" "}
                          {food.fat || 0}g
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-destructive">
                        {food.error || "Rasmni qayta yuborib ko'ring."}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex w-24 shrink-0 flex-col items-end justify-center gap-2 border-l border-border/20 px-3 py-2.5">
                {scanStatus === "draft" ? (
                  <span className="whitespace-nowrap text-[15px] font-black leading-none text-emerald-600 tabular-nums dark:text-emerald-400">
                    {food.cal || 0}
                    <span className="ml-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                      kcal
                    </span>
                  </span>
                ) : null}

                {scanStatus === "error" ? (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRetryScan?.(food);
                      }}
                      aria-label="Qayta urinish"
                    >
                      <RefreshCwIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveScan?.(food.id);
                      }}
                      aria-label="O'chirish"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

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
        if (hasIngredientBreakdown) {
          setIngredientsOpen(true);
        } else {
          setPortionOpen(true);
        }
      }
    };

    const handleOpenDetails = () => {
      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false;
        return;
      }

      if (isSelectionMode) {
        if (canSelect) {
          onToggleSelect?.(mealType, food);
        }
        return;
      }

      if (!isConsumed) return;
      setLogOpen(true);
    };

    const handleKeyboardOpen = () => {
      if (isSelectionMode) {
        if (canSelect) {
          onToggleSelect?.(mealType, food);
        }
        return;
      }

      if (isConsumed) {
        setLogOpen(true);
        return;
      }

      if (readOnly) return;

      if (hasIngredientBreakdown) {
        setIngredientsOpen(true);
      } else {
        setPortionOpen(true);
      }
    };

    const handleCardKeyDown = (event) => {
      if (event.target !== event.currentTarget) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleKeyboardOpen();
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        isConsumed &&
        !readOnly
      ) {
        event.preventDefault();
        setDeleteConfirmOpen(true);
      }
    };

    const handlePointerDown = () => {
      if (!canSelect || isSelectionMode || typeof window === "undefined") {
        return;
      }

      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        onEnterSelectionMode?.();
        onToggleSelect?.(mealType, food);
      }, 450);
    };

    const clearLongPress = () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
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

    const handleIngredientSave = (nextIngredients, totals) => {
      if (readOnly) return;

      if (!isConsumed) {
        onLogPlanned?.(mealType, food, {
          macros: {
            cal: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat,
          },
          ingredients: nextIngredients,
        });
        setIngredientsOpen(false);
        return;
      }

      onUpdateLoggedMeal?.(mealType, food.id, {
        ingredients: nextIngredients,
        cal: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber,
      });
      setIngredientsOpen(false);
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
            role="button"
            tabIndex={0}
            aria-label={`${food.name} ovqat kartasi`}
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
            onPointerDown={handlePointerDown}
            onPointerUp={clearLongPress}
            onPointerLeave={clearLongPress}
            onPointerCancel={clearLongPress}
            onKeyDown={handleCardKeyDown}
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
                  <img loading="lazy"
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
                {isSelectionMode && canSelect ? (
                  <button
                    type="button"
                    className={cn(
                      "absolute left-2 top-2 grid size-6 place-items-center rounded-full border bg-background/90 shadow-sm",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleSelect?.(mealType, food);
                    }}
                    aria-label={
                      isSelected ? "Tanlovdan olish" : "Ovqatni tanlash"
                    }
                  >
                    {isSelected ? <CheckIcon className="size-3.5" /> : null}
                  </button>
                ) : null}
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
                    {map(MACROS, ({ key, color }) => (
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
                {isSelectionMode && canSelect ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleSelect?.(mealType, food);
                    }}
                    className={cn(
                      "size-9 rounded-full border flex items-center justify-center transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 text-muted-foreground hover:bg-muted",
                    )}
                    aria-label={
                      isSelected ? "Tanlovdan olish" : "Ovqatni tanlash"
                    }
                  >
                    {isSelected ? <CheckIcon className="size-4" /> : null}
                  </button>
                ) : null}

                {!isSelectionMode && isFromPlan && (
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

                {!isSelectionMode && isConsumed && !isFromPlan && (
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

                {!isSelectionMode && readOnly && isConsumed ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCopyMealToToday?.(mealType, food);
                    }}
                    className="size-9 rounded-full border border-primary/25 bg-primary/10 text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                    aria-label="Bugunga qo'shish"
                    title="Bugunga qo'shish"
                  >
                    <PlusIcon className="size-4" />
                  </button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Ovqatni o'chirish?</DialogTitle>
              <DialogDescription>
                {food.name} ushbu kunlik logdan olib tashlanadi.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  onRemove?.(mealType, food);
                }}
              >
                O'chirish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                ? () =>
                    hasIngredientBreakdown
                      ? setIngredientsOpen(true)
                      : setPortionOpen(true)
                : undefined
          }
          onTransfer={
            readOnly || !isConsumed
              ? undefined
              : (mode) => onTransferMeal?.({ mode, mealType, food })
          }
          readOnly={readOnly}
        />
        {hasIngredientBreakdown ? (
          <MealIngredientsEditorDrawer
            open={ingredientsOpen}
            onOpenChange={(nextOpen) => !nextOpen && setIngredientsOpen(false)}
            title={food?.name || "Taom"}
            description="Log qilingan taom ingredientlarini tahrirlang."
            imageUrl={food?.image || null}
            initialIngredients={ingredients}
            onSave={handleIngredientSave}
          />
        ) : (
          <PortionEditorDrawer
            food={food}
            open={portionOpen}
            onClose={() => setPortionOpen(false)}
            onConfirm={handlePortionConfirm}
          />
        )}
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
