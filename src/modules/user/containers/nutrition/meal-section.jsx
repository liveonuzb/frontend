import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";
import { ChevronDownIcon, CopyIcon, PlusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import EmptyState from "@/components/empty-state/index.jsx";
import { map, sumBy, isEmpty } from "lodash";
import MealCard from "./meal-card.jsx";

const mealConfig = {
  breakfast: { label: "Nonushta", emoji: "🍳", time: "06:00 - 10:00" },
  lunch: { label: "Tushlik", emoji: "🥗", time: "12:00 - 14:00" },
  dinner: { label: "Kechki ovqat", emoji: "🍲", time: "18:00 - 21:00" },
  snack: { label: "Snack", emoji: "🥜", time: "Istalgan vaqt" },
};

const getMealIdentity = (item = {}) =>
  item.barcode ||
  [item.name, item.grams ?? item.defaultAmount ?? "", item.unit ?? ""]
    .filter(Boolean)
    .join(":");

const getStoredOpenState = (type) => {
  if (typeof window === "undefined") return true;

  const value = window.localStorage.getItem(`nutrition:meal-section:${type}`);
  return value == null ? true : value === "open";
};

const MealCardSkeleton = () => (
  <div className="flex overflow-hidden rounded-2xl border bg-card">
    <Skeleton className="size-24 shrink-0 rounded-none" />
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-3 py-3">
      <Skeleton className="h-4 w-2/3 rounded" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
    <div className="flex w-20 shrink-0 flex-col items-end justify-center gap-3 border-l border-border/20 px-3">
      <Skeleton className="h-4 w-12 rounded" />
      <Skeleton className="size-9 rounded-full" />
    </div>
  </div>
);

const MealSection = ({
  type,
  isActive = false,
  time,
  items = [],
  plannedItems = [],
  onRemove,
  onAdd,
  onTogglePlanned,
  onLogPlanned,
  onImageUpload,
  onUpdateMeal,
  onRetryScan,
  onRemoveScan,
  onOpenDraftScan,
  readOnly = false,
  showAddButton = true,
  isLoading = false,
  addDisabled = false,
  onCopyFromYesterday,
}) => {
  const config = mealConfig[type];
  const displayTime = time || config.time;
  const [isOpen, setIsOpen] = React.useState(() => getStoredOpenState(type));

  React.useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      `nutrition:meal-section:${type}`,
      isOpen ? "open" : "closed",
    );
  }, [isOpen, type]);

  const allSectionItems = React.useMemo(() => {
    const loggedQueues = new Map();

    items.forEach((item) => {
      const identity = getMealIdentity(item);
      const queue = loggedQueues.get(identity) || [];
      queue.push(item);
      loggedQueues.set(identity, queue);
    });

    const mergedItems = plannedItems.map((plannedItem) => {
      const identity = getMealIdentity(plannedItem);
      const queue = loggedQueues.get(identity);

      if (queue?.length) {
        const consumedItem = queue.shift();
        return {
          ...consumedItem,
          isConsumed: true,
          isFromPlanLinked: true,
        };
      }

      return {
        ...plannedItem,
        isPlanned: true,
        isConsumed: false,
        isFromPlanLinked: true,
      };
    });

    loggedQueues.forEach((queue) => {
      queue.forEach((item) => {
        mergedItems.push({
          ...item,
          isConsumed: true,
          isFromPlanLinked: false,
        });
      });
    });

    return mergedItems;
  }, [items, plannedItems]);

  const currentKcal = Math.round(sumBy(items, (f) => (f.cal ?? 0) * (f.qty ?? 1)));

  const handleSaveImage = (
    mealType,
    food,
    imageDataUrl,
    adjustedGrams,
    macros,
  ) => {
    onImageUpload(mealType, food.id, imageDataUrl, adjustedGrams, macros);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 py-6",
        isActive &&
          "border-primary/40 ring-2 ring-primary/20 shadow-md shadow-primary/5",
      )}
    >
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen((o) => !o)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{config.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-[15px] font-bold leading-none">
                  {config.label}
                </CardTitle>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-wider">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    Hozir
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">
                {displayTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {currentKcal > 0 && (
              <span className="text-sm font-black tabular-nums text-foreground/80">
                {currentKcal}
                <span className="text-[10px] font-bold text-muted-foreground/60 ml-0.5 uppercase">
                  kcal
                </span>
              </span>
            )}
            {allSectionItems.length > 0 && (
              <span className="text-[10px] font-bold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                {allSectionItems.length}
              </span>
            )}
            <ChevronDownIcon
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-300",
                isOpen && "rotate-180",
              )}
            />
          </div>
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <CardContent className="">
              {isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((item) => (
                    <MealCardSkeleton key={item} />
                  ))}
                </div>
              ) : !isEmpty(allSectionItems) ? (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {map(allSectionItems, (food, i) => (
                      <MealCard
                        key={food.id || `${food.name}-${i}`}
                        food={food}
                        index={i}
                        mealType={type}
                        isFromPlan={Boolean(food.isFromPlanLinked)}
                        onRemove={onRemove}
                        onTogglePlanned={onTogglePlanned}
                        onLogPlanned={onLogPlanned}
                        onSaveImage={handleSaveImage}
                        onUpdateLoggedMeal={onUpdateMeal}
                        onRetryScan={onRetryScan}
                        onRemoveScan={onRemoveScan}
                        onOpenDraftScan={onOpenDraftScan}
                        readOnly={readOnly}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState
                  emoji={config.emoji}
                  title={`${config.label} bo'sh`}
                  description={
                    readOnly
                      ? "Bu bo'limda hali ovqat log qilinmagan"
                      : "Ovqat qo'shishingiz mumkin"
                  }
                  className="py-2"
                />
              )}
            </CardContent>
            {showAddButton && onAdd && !readOnly ? (
              <CardFooter className={"mt-5 gap-2 pb-0"}>
                {onCopyFromYesterday ? (
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={addDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyFromYesterday(type);
                    }}
                    aria-label={`${config.label} kechagi ovqatlardan nusxa ko'chirish`}
                    title="Kechagi nusxa"
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                ) : null}
                <Button
                  size="default"
                  variant={"outline"}
                  className="flex-1"
                  disabled={addDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                >
                  <PlusIcon className="size-4 mr-1.5" />
                  Qo'shish
                </Button>
              </CardFooter>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default MealSection;
