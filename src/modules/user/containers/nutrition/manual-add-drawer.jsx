import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeftIcon,
  CalculatorIcon,
  CheckIcon,
  HeartIcon,
  HistoryIcon,
  Loader2Icon,
  PlusIcon,
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
import GaugeProgress from "../../../../components/meal-plan-builder/gauge-progress.jsx";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import { Drawer } from "@/components/ui/drawer";

const mealConfig = {
  breakfast: { label: "Nonushta", emoji: "🍳", time: "06:00 - 10:00" },
  lunch: { label: "Tushlik", emoji: "🥗", time: "12:00 - 14:00" },
  dinner: { label: "Kechki ovqat", emoji: "🍲", time: "18:00 - 21:00" },
  snack: { label: "Snack", emoji: "🥜", time: "Istalgan vaqt" },
};

const calcMacros = (food, amount) => {
  const isUnit = food?.unit && food.unit !== "g" && food.unit !== "ml";
  const factor = isUnit ? amount / (food.defaultAmount || 1) : amount / 100;

  return {
    cal: Math.round((food?.baseCal ?? food?.cal ?? 0) * factor),
    protein: Math.round((food?.baseProtein ?? food?.protein ?? 0) * factor),
    carbs: Math.round((food?.baseCarbs ?? food?.carbs ?? 0) * factor),
    fat: Math.round((food?.baseFat ?? food?.fat ?? 0) * factor),
  };
};

const getSliderMax = (food) => {
  const isUnit = food?.unit && food.unit !== "g" && food.unit !== "ml";
  return isUnit ? (food?.step || 1) * 20 : 1000;
};

export default function ManualAddDrawer({
  dateKey,
  mealType,
  initialSearch = "",
  onClose,
}) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedTabKey, setSelectedTabKey] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
  const [grams, setGrams] = useState(100);

  useLayoutEffect(() => {
    if (editingFood) setGrams(editingFood.defaultAmount || 100);
  }, [editingFood?.barcode]);

  useEffect(() => {
    setSearch(initialSearch || "");
    setEditingFood(null);
  }, [initialSearch, dateKey, mealType]);

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
    return Number(selectedTabKey);
  }, [selectedTabKey]);

  const {
    foods: categoryFoods,
    isLoading: isFoodsLoading,
    isError: isFoodsError,
    refetch: refetchFoods,
  } = useFoodsByCategory(selectedCategoryId);

  const foods = useMemo(
    () =>
      categoryFoods.map((food) => ({
        ...food,
        isFavorite: favoriteIdSet.has(food.catalogFoodId),
      })),
    [categoryFoods, favoriteIdSet],
  );

  const filteredFavorites = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return favorites;
    return favorites.filter(
      (food) =>
        food.name.toLowerCase().includes(normalizedSearch) ||
        food.originalName?.toLowerCase().includes(normalizedSearch),
    );
  }, [favorites, search]);

  const filteredRecentFoods = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return recentFoods;
    return recentFoods.filter(
      (food) =>
        food.name.toLowerCase().includes(normalizedSearch) ||
        food.originalName?.toLowerCase().includes(normalizedSearch),
    );
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
      ...categories.map((category) => ({
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
    if (!selectedTabKey || !tabEntries.some((entry) => entry.key === selectedTabKey)) {
      setSelectedTabKey(tabEntries[0].key);
    }
  }, [selectedTabKey, tabEntries]);

  const tabFoods = useMemo(() => {
    if (selectedTabKey === "__favorites__") return filteredFavorites;
    if (selectedTabKey === "__recent__") return filteredRecentFoods;

    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return foods;
    return foods.filter(
      (food) =>
        food.name.toLowerCase().includes(normalizedSearch) ||
        food.originalName?.toLowerCase().includes(normalizedSearch),
    );
  }, [foods, filteredFavorites, filteredRecentFoods, search, selectedTabKey]);

  const calculateMacros = (baseFood, amount) => calcMacros(baseFood, amount);

  const openFoodEditor = useCallback((food) => {
    setEditingFood({ ...food, grams: food.defaultAmount || 100 });
  }, []);

  const handleSaveFood = async () => {
    if (!editingFood) return;
    const macros = calculateMacros(editingFood, grams);
    try {
      await addMealAction(dateKey, mealType, {
        ...editingFood,
        source: "manual",
        qty: 1,
        grams,
        cal: macros.cal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        addedFromPlan: false,
      });
      toast.success(`${editingFood.name} qo'shildi!`);
      setEditingFood(null);
    } catch {
      toast.error("Ovqatni qo'shib bo'lmadi");
    }
  };

  const config = mealConfig[mealType] || { label: "Ovqat", emoji: "🍽️" };

  return (
    <>
      <DrawerHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <DrawerTitle className="text-xl flex items-center gap-2">
            <span>{config.emoji}</span>
            <span>{config.label}ga qo'shish</span>
          </DrawerTitle>
        </div>
        <DrawerDescription>
          Katalogdan ovqat tanlang.
        </DrawerDescription>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Ovqat qidirish..."
            className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 mask-edges -mx-4 px-4 pt-1">
          {tabEntries.map((entry) => (
            <button
              key={entry.key}
              type="button"
              aria-pressed={selectedTabKey === entry.key}
              onClick={() => setSelectedTabKey(entry.key)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border shrink-0",
                selectedTabKey === entry.key
                  ? "bg-foreground text-background border-foreground shadow-sm scale-105"
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

      <DrawerBody className="p-0">
        <ScrollArea className="h-full px-4">
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
            <div className="space-y-3 pb-8">
              <AnimatePresence initial={false}>
                {tabFoods.map((food) => {
                  const isAdded = currentMealFoods.some(
                    (entry) =>
                      (entry.barcode && food.barcode && entry.barcode === food.barcode) ||
                      entry.id === food.id ||
                      (!entry.barcode && !food.barcode && entry.name === food.name),
                  );
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={food.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-[1.25rem] border transition-all duration-300",
                        isAdded
                          ? "border-primary/30 bg-primary/5"
                          : "bg-card hover:bg-muted/50 border-border/40 cursor-pointer",
                      )}
                      onClick={() => { if (!isAdded) openFoodEditor(food); }}
                    >
                      <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                        {food.image ? (
                          <img loading="lazy" src={food.image} alt={food.name} className="size-full object-cover" />
                        ) : (
                          <span className="text-2xl">{food.emoji}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-[15px] font-bold truncate transition-colors leading-tight mb-2 text-foreground">
                          {food.name}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1.5 min-w-[32px]">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            {food.protein ?? 0}g
                          </span>
                          <span className="flex items-center gap-1.5 min-w-[32px]">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            {food.carbs ?? 0}g
                          </span>
                          <span className="flex items-center gap-1.5 min-w-[32px]">
                            <span className="size-1.5 rounded-full bg-blue-500" />
                            {food.fat ?? 0}g
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end justify-center shrink-0">
                        <span className="text-base font-black tabular-nums leading-tight text-foreground/90">
                          {food.cal}{" "}
                          <span className="text-[10px] font-bold uppercase text-muted-foreground/60">kcal</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">{food.serving}</span>
                      </div>

                      <div className="pl-2 shrink-0 flex items-center gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                          disabled={isUpdatingFavorite}
                          onClick={(e) => { e.stopPropagation(); void toggleFavoriteFood(food); }}
                        >
                          <HeartIcon
                            className={cn(
                              "size-4",
                              food.isFavorite ? "fill-current text-primary" : "text-muted-foreground",
                            )}
                          />
                        </Button>
                        {isAdded ? (
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <CheckIcon className="size-4" />
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors"
                          >
                            <PlusIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
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

      {/* Portion editor drawer */}
      <Drawer
        open={!!editingFood}
        onOpenChange={(open) => !open && setEditingFood(null)}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <span>{editingFood?.emoji}</span>
              <span>{editingFood?.name}</span>
            </DrawerTitle>
            <DrawerDescription>
              Porsiya hajmini tanlang ({editingFood?.unit || "g"})
            </DrawerDescription>
          </DrawerHeader>

          {editingFood && (
            <DrawerBody className="space-y-8">
              {editingFood.image && (
                <div className="h-40 w-full rounded-2xl overflow-hidden bg-muted/30 -mt-2">
                  <img
                    src={editingFood.image}
                    alt={editingFood.name}
                    loading="lazy"
                    width={640}
                    height={360}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex flex-col items-center">
                <GaugeProgress
                  value={calculateMacros(editingFood, grams).cal}
                  max={calculateMacros(editingFood, getSliderMax(editingFood)).cal}
                  id={editingFood.barcode || "manual"}
                />
                <div className="grid grid-cols-3 gap-8 w-full border-t border-border/50 pt-6 px-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                      🍗 Oqsil
                    </span>
                    <span className="text-base font-black">
                      <span className="text-red-500">{calculateMacros(editingFood, grams).protein}</span>
                      <span className="opacity-50 text-xs text-muted-foreground font-semibold">/{goals.protein}g</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 border-l border-r border-border/50 px-4">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                      🍴 Uglevod
                    </span>
                    <span className="text-base font-black">
                      <span className="text-orange-500">{calculateMacros(editingFood, grams).carbs}</span>
                      <span className="opacity-50 text-xs text-muted-foreground font-semibold">/{goals.carbs}g</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                      🥑 Yog'
                    </span>
                    <span className="text-base font-black">
                      <span className="text-green-500">{calculateMacros(editingFood, grams).fat}</span>
                      <span className="opacity-50 text-xs text-muted-foreground font-semibold">/{goals.fat}g</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-medium text-muted-foreground">Miqdori:</span>
                  <span className="text-2xl font-black text-primary">
                    {grams}{editingFood.unit || "g"}
                  </span>
                </div>
                <Slider
                  value={[grams]}
                  min={editingFood.step || 10}
                  max={getSliderMax(editingFood)}
                  step={editingFood.step || 10}
                  onValueChange={([val]) => setGrams(val)}
                  className="py-4"
                />
              </div>

              {editingFood.vitamins ? (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <CalculatorIcon className="size-3" /> Vitaminlar va Minerallar
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(editingFood.vitamins).map(([name, amount]) => (
                      <div key={name} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">{name}</span>
                        <span className="font-black text-foreground">{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </DrawerBody>
          )}

          <DrawerFooter>
            <Button variant="outline" onClick={() => setEditingFood(null)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSaveFood}>Saqlash</Button>
          </DrawerFooter>
        </NutritionDrawerContent>
      </Drawer>
    </>
  );
}
