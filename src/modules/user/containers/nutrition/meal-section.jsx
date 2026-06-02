import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  Clock3Icon,
  CopyIcon,
  PlusIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import EmptyState from "@/components/empty-state/index.jsx";
import map from "lodash/map";
import sumBy from "lodash/sumBy";
import isEmpty from "lodash/isEmpty";
import filter from "lodash/filter";
import forEach from "lodash/forEach";
import MealCard from "./meal-card.jsx";
import { getMealConfig } from "@/modules/user/lib/meal-config";

const getMealIdentity = (item = {}) =>
  item.barcode ||
  filter(
    [item.name, item.grams ?? item.defaultAmount ?? "", item.unit ?? ""],
    Boolean,
  )
    .join(":");

const getStoredOpenState = (type) => {
  if (typeof window === "undefined") return true;

  const value = window.localStorage.getItem(`nutrition:meal-section:${type}`);
  return value == null ? true : value === "open";
};

const MealCardSkeleton = () => (
  <div className="flex overflow-hidden rounded-2xl border bg-card">
    <Skeleton className="size-24 shrink-0 rounded-none" />
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3">
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
  onTransferMeal,
  onCopyMealToToday,
  readOnly = false,
  showAddButton = true,
  isLoading = false,
  addDisabled = false,
  onCopyFromYesterday,
  isSelectionMode = false,
  selectedItems = {},
  onToggleSelect,
  onEnterSelectionMode,
}) => {
  const config = getMealConfig(type, {
    label: "Ovqat",
    emoji: "🍽️",
    time: "Istalgan vaqt",
  });
  const displayTime = time || config.time;
  const [isOpen, setIsOpen] = React.useState(() => getStoredOpenState(type));
  const virtualParentRef = React.useRef(null);

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

    forEach(items, (item) => {
      const identity = getMealIdentity(item);
      const queue = loggedQueues.get(identity) || [];
      queue.push(item);
      loggedQueues.set(identity, queue);
    });

    const mergedItems = map(plannedItems, (plannedItem) => {
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

    forEach(loggedQueues, (queue) => {
      forEach(queue, (item) => {
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
  const statusMeta = isActive
    ? { label: "Hozir", className: "bg-primary/10 text-primary", icon: Clock3Icon }
    : allSectionItems.length > 0
      ? { label: "Yakunlandi", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2Icon }
      : { label: "Kutilmoqda", className: "bg-muted text-muted-foreground", icon: Clock3Icon };
  const StatusIcon = statusMeta.icon;
  const shouldVirtualize = allSectionItems.length >= 20;
  const rowVirtualizer = useVirtualizer({
    count: allSectionItems.length,
    getScrollElement: () => virtualParentRef.current,
    estimateSize: () => 112,
    overscan: 6,
    getItemKey: (index) => {
      const food = allSectionItems[index];
      return food?.id || `${food?.name || "meal"}-${index}`;
    },
  });

  const handleSaveImage = (
    mealType,
    food,
    imageDataUrl,
    adjustedGrams,
    macros,
  ) => {
    onImageUpload(mealType, food.id, imageDataUrl, adjustedGrams, macros);
  };

  const renderMealCard = (food, i) => (
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
      onTransferMeal={onTransferMeal}
      onCopyMealToToday={onCopyMealToToday}
      readOnly={readOnly}
      isSelectionMode={isSelectionMode}
      isSelected={Boolean(selectedItems[`${type}:${food.id}`])}
      onToggleSelect={onToggleSelect}
      onEnterSelectionMode={onEnterSelectionMode}
    />
  );

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border bg-card py-5 shadow-sm transition-all duration-300",
        isActive &&
          "border-primary/40 ring-2 ring-primary/20 shadow-md shadow-primary/5",
      )}
    >
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen((o) => !o)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-2xl leading-none">
              {config.emoji}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-black leading-none">
                  {config.label}
                </CardTitle>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black",
                    statusMeta.className,
                  )}
                >
                  <StatusIcon className="size-3" />
                  {statusMeta.label}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium mt-0.5 block">
                {displayTime} • {allSectionItems.length} ta ovqat
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-right text-sm font-black tabular-nums text-foreground/80">
              {currentKcal > 0 ? (
                <>
                {currentKcal}
                <span className="text-[10px] font-bold text-muted-foreground/60 ml-0.5 uppercase">
                  kcal
                </span>
                </>
              ) : "0 kcal"}
            </span>
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
                  {map([0, 1, 2], (item) => (
                    <MealCardSkeleton key={item} />
                  ))}
                </div>
              ) : !isEmpty(allSectionItems) && shouldVirtualize ? (
                <div
                  ref={virtualParentRef}
                  className="max-h-[620px] overflow-y-auto pr-1"
                  style={{
                    height: Math.min(620, rowVirtualizer.getTotalSize()),
                  }}
                >
                  <div
                    className="relative w-full"
                    style={{ height: rowVirtualizer.getTotalSize() }}
                  >
                    {map(rowVirtualizer.getVirtualItems(), (virtualItem) => {
                      const food = allSectionItems[virtualItem.index];
                      return (
                        <div
                          key={virtualItem.key}
                          data-index={virtualItem.index}
                          ref={rowVirtualizer.measureElement}
                          className="absolute left-0 top-0 w-full pb-2"
                          style={{
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          {renderMealCard(food, virtualItem.index)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !isEmpty(allSectionItems) ? (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {map(allSectionItems, renderMealCard)}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-3">
                  <EmptyState
                    emoji={config.emoji}
                    title={`${config.label} bo'sh`}
                    description={
                      readOnly
                        ? "Bu bo'limda hali ovqat log qilinmagan"
                        : "Ovqat qo'shish uchun tezkor variantni tanlang"
                    }
                    className="py-2"
                  />
                  {!readOnly ? (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {onCopyFromYesterday ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={addDisabled}
                          onClick={() => onCopyFromYesterday(type)}
                        >
                          Kechagi nusxa
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={addDisabled}
                        onClick={onAdd}
                      >
                        Saqlanganlardan
                      </Button>
                      <Button
                        type="button"
                        disabled={addDisabled}
                        onClick={onAdd}
                      >
                        Rasmga olish
                      </Button>
                    </div>
                  ) : null}
                </div>
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
