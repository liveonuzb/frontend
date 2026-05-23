import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HeartIcon,
  HistoryIcon,
  Loader2Icon,
  SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import useFoodCatalog, {
  useFoodQuickAddActions,
  useFoodsByCategory,
} from "@/hooks/app/use-food-catalog";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import { Drawer } from "@/components/ui/drawer";
import { getMealConfig } from "@/modules/user/lib/meal-config";
import FoodDetailPortionDrawer, {
  calculateFoodPortionMacros,
  getFoodSliderMax,
} from "./food-detail-portion-drawer.jsx";

import { filter, map, some, toLower, toNumber, includes, trim } from "lodash";

export default function ManualAddDrawer({
  dateKey,
  initialFood = null,
  mealType,
  loggedAt = null,
  initialSearch = "",
  onClose,
}) {
  const [search, setSearch] = useState(initialSearch);
  const deferredSearch = useDeferredValue(search);
  const [selectedTabKey, setSelectedTabKey] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
  const [grams, setGrams] = useState(100);
  const loadMoreRef = useRef(null);

  /*
   * Manual add keeps editable grams/search/tab state local to the active food
   * and route context.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (editingFood) setGrams(editingFood.defaultAmount || 100);
  }, [editingFood?.barcode]);

  useEffect(() => {
    setSearch(initialSearch || initialFood?.name || "");
    setEditingFood(initialFood ? { ...initialFood } : null);
  }, [initialFood, initialSearch, dateKey, mealType]);

  const { addMeal: addMealAction } = useDailyTrackingActions();
  const { dayData } = useDailyTrackingDay(dateKey);
  const {
    categories,
    favorites,
    recentFoods,
    favoriteIdSet,
    isLoading,
    isError,
    refetch,
  } = useFoodCatalog();
  const { goals } = useHealthGoals();
  const { toggleFavoriteFood, isUpdatingFavorite } = useFoodQuickAddActions();
  const currentMealFoods = dayData?.meals?.[mealType] || [];

  const selectedCategoryId = useMemo(() => {
    if (
      !selectedTabKey ||
      selectedTabKey === "__favorites__" ||
      selectedTabKey === "__recent__"
    ) {
      return null;
    }
    return toNumber(selectedTabKey);
  }, [selectedTabKey]);

  const {
    foods: categoryFoods,
    isLoading: isFoodsLoading,
    isError: isFoodsError,
    refetch: refetchFoods,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFoodsByCategory(selectedCategoryId, {
    search: deferredSearch,
    enabled: Boolean(selectedCategoryId),
  });

  const foods = useMemo(
    () =>
      map(categoryFoods, (food) => ({
        ...food,
        isFavorite: favoriteIdSet.has(food.catalogFoodId),
      })),
    [categoryFoods, favoriteIdSet],
  );

  const filteredFavorites = useMemo(() => {
    const normalizedSearch = toLower(trim(search));
    if (!normalizedSearch) return favorites;
    return filter(favorites, (food) =>
      includes(toLower(food.name), normalizedSearch) ||
      includes(toLower(food.originalName), normalizedSearch));
  }, [favorites, search]);

  const filteredRecentFoods = useMemo(() => {
    const normalizedSearch = toLower(trim(search));
    if (!normalizedSearch) return recentFoods;
    return filter(recentFoods, (food) =>
      includes(toLower(food.name), normalizedSearch) ||
      includes(toLower(food.originalName), normalizedSearch));
  }, [recentFoods, search]);

  const tabEntries = useMemo(() => {
    const entries = [];
    if (filteredFavorites.length > 0) {
      entries.push({
        key: "__favorites__",
        label: "Sevimlilar",
        count: filteredFavorites.length,
        icon: HeartIcon,
      });
    }
    if (filteredRecentFoods.length > 0) {
      entries.push({
        key: "__recent__",
        label: "Oxirgi",
        count: filteredRecentFoods.length,
        icon: HistoryIcon,
      });
    }
    return [
      ...entries,
      ...map(categories, (category) => ({
        key: String(category.id),
        label: category.label,
        count: null,
        icon: null,
      })),
    ];
  }, [categories, filteredFavorites.length, filteredRecentFoods.length]);

  useEffect(() => {
    if (tabEntries.length === 0) {
      setSelectedTabKey(null);
      return;
    }
    if (!selectedTabKey || !some(tabEntries, (entry) => entry.key === selectedTabKey)) {
      setSelectedTabKey(tabEntries[0].key);
    }
  }, [selectedTabKey, tabEntries]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const tabFoods = useMemo(() => {
    if (selectedTabKey === "__favorites__") return filteredFavorites;
    if (selectedTabKey === "__recent__") return filteredRecentFoods;

    return foods;
  }, [foods, filteredFavorites, filteredRecentFoods, selectedTabKey]);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !hasNextPage || isFetchingNextPage || !selectedCategoryId) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, selectedCategoryId]);

  const calculateMacros = (baseFood, amount) =>
    calculateFoodPortionMacros(baseFood, amount);

  const openFoodEditor = useCallback((food) => {
    setEditingFood({ ...food, grams: food.defaultAmount || 100 });
  }, []);

  const handleSaveFood = async (payload = {}) => {
    const selectedFood = payload.item || editingFood;
    const selectedGrams = payload.grams ?? grams;
    if (!selectedFood) return;
    const macros = payload.macros || calculateMacros(selectedFood, selectedGrams);
    const selectedIngredients = payload.ingredients ?? selectedFood.ingredients ?? [];
    try {
      await addMealAction(dateKey, mealType, {
        ...selectedFood,
        source: "manual",
        qty: 1,
        grams: selectedGrams,
        cal: macros.cal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        fiber: macros.fiber,
        ingredients: selectedIngredients,
        addedAt: loggedAt || undefined,
        addedFromPlan: false,
      });
      toast.success(`${selectedFood.name} qo'shildi!`);
      setEditingFood(null);
    } catch {
      toast.error("Ovqatni qo'shib bo'lmadi");
    }
  };

  const config = getMealConfig(mealType, { label: "Ovqat", emoji: "🍽️" });

  return (
    <>
      <DrawerHeader className="flex flex-col items-center gap-4 text-center md:text-center">
        <DrawerTitle className="text-center text-xl font-semibold">
          {config.label}ga qo'shish
        </DrawerTitle>
        <DrawerDescription className="text-center">
          Katalogdan ovqat tanlang.
        </DrawerDescription>
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Ovqat qidirish..."
            className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex w-full scroll-px-5 items-center gap-2 overflow-x-auto custom-scrollbar -mx-4 pt-1 mask-edges no-scrollbar">
          {map(tabEntries, (entry) => (
            <button
              key={entry.key}
              type="button"
              aria-pressed={selectedTabKey === entry.key}
              onClick={() => setSelectedTabKey(entry.key)}
              className={cn(
                "cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black whitespace-nowrap border shrink-0 transition-colors duration-200",
                selectedTabKey === entry.key
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-background/80 text-muted-foreground border-border/40 hover:bg-muted/80 hover:border-border/60",
              )}
            >
              {entry.icon ? (
                <entry.icon
                  className={cn(
                    "size-3.5",
                    selectedTabKey === entry.key ? "text-background" : "text-muted-foreground",
                  )}
                />
              ) : null}
              <span>{entry.label}</span>
              {entry.count !== null ? (
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-md",
                    selectedTabKey === entry.key
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {entry.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </DrawerHeader>
      <DrawerBody className="h-[clamp(18rem,calc(90dvh-14rem),32rem)] flex-none overflow-hidden p-0 scroll-mask-y">
        <ScrollArea className="h-full px-4 [&_[data-slot=scroll-area-viewport]]:overscroll-contain scrollbar-hide">
          {isLoading ? (
            <div className="text-center py-12 px-4">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-1">Katalog yuklanmoqda</h3>
              <p className="text-sm text-muted-foreground">
                Tasdiqlangan ovqatlar ro'yxati olinmoqda
              </p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 px-4">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Katalogni yuklab bo'lmadi</h3>
              <p className="text-sm text-muted-foreground">Keyinroq qayta urinib ko'ring</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void refetch()}
              >
                Qayta urinish
              </Button>
            </div>
          ) : isFoodsLoading ? (
            <div className="text-center py-12 px-4">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-1">Ovqatlar yuklanmoqda</h3>
              <p className="text-sm text-muted-foreground">
                Kategoriya bo'yicha ovqatlar olinmoqda
              </p>
            </div>
          ) : isFoodsError ? (
            <div className="text-center py-12 px-4">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Ovqatlarni yuklab bo'lmadi</h3>
              <p className="text-sm text-muted-foreground">Keyinroq qayta urinib ko'ring</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void refetchFoods()}
              >
                Qayta urinish
              </Button>
            </div>
          ) : tabFoods.length > 0 ? (
            <div className="min-h-full space-y-2.5 pb-8">
              <AnimatePresence initial={false}>
                {map(tabFoods, (food) => {
                  const isAdded = some(currentMealFoods, (entry) =>
                    (entry.barcode && food.barcode && entry.barcode === food.barcode) ||
                    entry.id === food.id ||
                    (!entry.barcode && !food.barcode && entry.name === food.name));
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={food.id}
                      className={cn(
                        "grid h-16 grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_2.25rem] items-center gap-1.5 rounded-xl border px-2 transition-colors duration-200",
                        isAdded
                          ? "border-primary/30 bg-primary/5"
                          : "bg-card hover:bg-muted/50 border-border/40 cursor-pointer",
                      )}
                      onClick={() => { if (!isAdded) openFoodEditor(food); }}
                    >
                      <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                        {food.image ? (
                          <img loading="lazy" src={food.image} alt={food.name} className="size-full object-cover" />
                        ) : (
                          <span className="text-lg">{food.emoji}</span>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-col justify-center">
                        <p className="mb-1 truncate text-[13px] font-bold leading-tight text-foreground transition-colors">
                          {food.name}
                        </p>
                        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[9px] font-semibold text-muted-foreground">
                          <span className="flex min-w-0 shrink-0 items-center gap-1">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            {food.protein ?? 0}g
                          </span>
                          <span className="flex min-w-0 shrink-0 items-center gap-1">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            {food.carbs ?? 0}g
                          </span>
                          <span className="flex min-w-0 shrink-0 items-center gap-1">
                            <span className="size-1.5 rounded-full bg-blue-500" />
                            {food.fat ?? 0}g
                          </span>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col items-end justify-center text-right">
                        <span className="text-[13px] font-black tabular-nums leading-tight text-foreground/90">
                          {food.cal}{" "}
                          <span className="text-[8px] font-bold uppercase text-muted-foreground/60">kcal</span>
                        </span>
                        <span className="mt-0.5 max-w-full truncate text-[8px] text-muted-foreground">{food.serving}</span>
                      </div>

                      <div className="flex min-w-0 items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full"
                          disabled={isUpdatingFavorite}
                          onClick={(e) => { e.stopPropagation(); void toggleFavoriteFood(food); }}
                        >
                          <HeartIcon
                            className={cn(
                              "size-4.5",
                              food.isFavorite ? "fill-current text-primary" : "text-muted-foreground",
                            )}
                          />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {selectedCategoryId && hasNextPage ? (
                <div ref={loadMoreRef} className="flex justify-center py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs font-bold text-muted-foreground"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2Icon className="mr-2 size-3.5 animate-spin" />
                        Yuklanmoqda
                      </>
                    ) : (
                      "Yana yuklash"
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Ovqat topilmadi</h3>
              <p className="text-sm text-muted-foreground">
                Boshqa nom bilan qidirib ko'ring
              </p>
            </div>
          )}
        </ScrollArea>
      </DrawerBody>
      <DrawerFooter className={'p-2'}/>
      {/* Portion editor drawer */}
      <Drawer
        open={!!editingFood}
        onOpenChange={(open) => !open && setEditingFood(null)}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <FoodDetailPortionDrawer
            item={editingFood}
            type="food"
            grams={grams}
            goals={goals}
            ingredients={editingFood?.ingredients}
            onGramsChange={setGrams}
            onSave={handleSaveFood}
            macroCalculator={calculateMacros}
            sliderMax={editingFood ? getFoodSliderMax(editingFood) : undefined}
          />
        </NutritionDrawerContent>
      </Drawer>
    </>
  );
}
