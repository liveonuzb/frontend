import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  keyBy,
  mapValues,
  differenceBy,
  reject,
  findIndex,
  sortBy,
  keys,
  map,
  find,
  filter,
  forEach,
} from "lodash";
import useIsMobile from "@/hooks/utils/use-mobile.js";

import {
  SearchIcon,
  PlusIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  FlameIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import useFoodCatalog from "@/hooks/app/use-food-catalog";
import { toast } from "sonner";
import {
  Kanban,
  KanbanBoard,
  KanbanOverlay,
} from "@/components/reui/kanban.jsx";
// Tabs replaced with custom scrollable day pills
import LibraryItem from "./library-item.jsx";
import BuilderColumn from "./builder-column.jsx";
import MobileAccordionColumn from "./mobile-accordion-column.jsx";
import MobileFoodLibraryDrawer from "./mobile-food-library-drawer.jsx";
import { Card } from "@/components/ui/card.jsx";
import PortionEditorDrawer from "./portion-editor-drawer.jsx";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";

const WEEK_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const CORE_MEALS = [
  { type: "Nonushta", time: "08:00-09:00" },
  { type: "Tushlik", time: "13:00-14:00" },
  { type: "Kechki ovqat", time: "19:00-20:00" },
];

const CORE_SORT_ORDER = { Nonushta: 1, Tushlik: 2, "Kechki ovqat": 3 };

const MAX_COLUMNS = 7;
const MAX_SNACKS = 4;

const validateColumnOrder = (columns) => {
  const pos = {};
  forEach(columns, (col, idx) => {
    if (CORE_SORT_ORDER[col.type]) pos[col.type] = idx;
  });
  if (
    pos["Nonushta"] !== undefined &&
    pos["Tushlik"] !== undefined &&
    pos["Nonushta"] > pos["Tushlik"]
  )
    return "Nonushta Tushlikdan oldin bo'lishi kerak!";
  if (
    pos["Tushlik"] !== undefined &&
    pos["Kechki ovqat"] !== undefined &&
    pos["Tushlik"] > pos["Kechki ovqat"]
  )
    return "Tushlik Kechki ovqatdan oldin bo'lishi kerak!";
  if (
    pos["Nonushta"] !== undefined &&
    pos["Kechki ovqat"] !== undefined &&
    pos["Nonushta"] > pos["Kechki ovqat"]
  )
    return "Nonushta Kechki ovqatdan oldin bo'lishi kerak!";
  return null;
};

const DAILY_GOALS = { cal: 2650, protein: 180, carbs: 240, fat: 80 };

const getTodayDayName = () => WEEK_DAYS[(new Date().getDay() + 6) % 7];

const normalizePlanFood = (food = {}, foodMap) => {
  const catalogFood = food?.barcode ? foodMap.get(food.barcode) : null;
  const baseFood = catalogFood ?? food;
  const defaultAmount = baseFood.defaultAmount || food.defaultAmount || 100;
  const grams = food.grams ?? defaultAmount;
  const isGrams =
    !baseFood.unit || baseFood.unit === "g" || baseFood.unit === "ml";
  const factor = isGrams ? grams / 100 : grams / defaultAmount;

  return {
    ...baseFood,
    ...food,
    image: food.image ?? baseFood.image ?? null,
    grams,
    defaultAmount,
    step: baseFood.step || 10,
    unit: baseFood.unit || "g",
    cal:
      food.cal ??
      Math.round((baseFood.baseCal ?? baseFood.cal ?? 0) * factor),
    protein:
      food.protein ??
      Math.round((baseFood.baseProtein ?? baseFood.protein ?? 0) * factor),
    carbs:
      food.carbs ??
      Math.round((baseFood.baseCarbs ?? baseFood.carbs ?? 0) * factor),
    fat:
      food.fat ??
      Math.round((baseFood.baseFat ?? baseFood.fat ?? 0) * factor),
  };
};

const normalizeDaysData = (data = {}, foodMap) =>
  mapValues(data, (columns = []) =>
    columns.map((column) => ({
      ...column,
      items: (column.items || []).map((item) => normalizePlanFood(item, foodMap)),
    })),
  );

const Index = ({
  initialData,
  selectedDay: propSelectedDay,
  onSave,
  onClose,
  open,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();
  const {
    foods,
    categories,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
  } = useFoodCatalog();
  const [selectedDay, setSelectedDay] = useState(
    propSelectedDay || getTodayDayName(),
  );
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 768,
  );
  const [foodLibraryOpen, setFoodLibraryOpen] = useState(false);
  const [targetColId, setTargetColId] = useState(null);

  const dayScrollRef = useRef(null);
  const activeDayRef = useRef(null);

  // Scroll active day pill into view on mount and when selectedDay changes
  useEffect(() => {
    if (activeDayRef.current && dayScrollRef.current) {
      activeDayRef.current.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });
    }
  }, [selectedDay]);

  const foodMap = useMemo(
    () => new Map(foods.map((food) => [food.barcode, food])),
    [foods],
  );

  const libraryFoodById = useMemo(
    () => new Map(foods.map((food) => [food.id, food])),
    [foods],
  );

  const [daysData, setDaysData] = useState(() =>
    normalizeDaysData(initialData || {}, foodMap),
  );

  useEffect(() => {
    setDaysData(normalizeDaysData(initialData || {}, foodMap));
  }, [initialData]);

  useEffect(() => {
    setDaysData((current) => normalizeDaysData(current, foodMap));
  }, [foodMap]);

  const [editingFood, setEditingFood] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  const categoriesWithAll = useMemo(
    () => [
      {
        id: "all",
        label: "Barchasi",
      },
      ...categories.map((category) => ({
        id: String(category.id),
        label: category.label || category.name,
      })),
    ],
    [categories],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    counts.set("all", foods.length);

    foods.forEach((food) => {
      (food.categoryIds || []).forEach((categoryId) => {
        const key = String(categoryId);
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return counts;
  }, [foods]);

  const filteredLibraryFoods = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return foods.filter((food) => {
      const matchesCategory =
        selectedCategoryId === "all"
          ? true
          : food.categoryIds?.includes(Number(selectedCategoryId));

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        food.name.toLowerCase().includes(normalizedSearch) ||
        food.originalName?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [foods, search, selectedCategoryId]);

  useEffect(() => {
    if (categoriesWithAll.length === 0) {
      setSelectedCategoryId("all");
      return;
    }

    if (
      !categoriesWithAll.some((category) => category.id === selectedCategoryId)
    ) {
      setSelectedCategoryId("all");
    }
  }, [categoriesWithAll, selectedCategoryId]);

  const currentDayColumns = daysData[selectedDay] || [];

  // lodash keyBy + mapValues bilan kanban columns map
  const kanbanColumns = useMemo(() => {
    return mapValues(keyBy(currentDayColumns, "id"), (col) => col.items);
  }, [currentDayColumns]);

  // lodash differenceBy bilan yetishmayotgan core meals
  const missingCoreMeals = useMemo(() => {
    return differenceBy(CORE_MEALS, currentDayColumns, "type");
  }, [currentDayColumns]);

  const recalculateSnackTimes = (columns) => {
    const parseTime = (t) => {
      if (!t) return null;
      const [start] = t.split("-");
      if (!start) return null;
      const [h, m] = start.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };

    const formatTime = (minutes) => {
      const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
      const m = (minutes % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    return map(columns, (col, index) => {
      if (
        col.type === "Snack" ||
        !find(CORE_MEALS, (m) => m.type === col.type)
      ) {
        let prevCore = null;
        for (let i = index - 1; i >= 0; i--) {
          if (find(CORE_MEALS, (m) => m.type === columns[i].type)) {
            prevCore = columns[i];
            break;
          }
        }
        let nextCore = null;
        for (let i = index + 1; i < columns.length; i++) {
          if (find(CORE_MEALS, (m) => m.type === columns[i].type)) {
            nextCore = columns[i];
            break;
          }
        }

        const prevStart = prevCore ? parseTime(prevCore.time) : null;
        const nextStart = nextCore ? parseTime(nextCore.time) : null;

        let snackStartMins;
        if (prevStart !== null && nextStart !== null) {
          snackStartMins = Math.floor((prevStart + nextStart) / 2);
        } else if (prevStart !== null) {
          snackStartMins = prevStart + 120;
        } else if (nextStart !== null) {
          snackStartMins = nextStart - 120;
        } else {
          snackStartMins = 16 * 60;
        }

        snackStartMins = Math.round(snackStartMins / 5) * 5;
        return {
          ...col,
          time: `${formatTime(snackStartMins)}-${formatTime(snackStartMins + 30)}`,
        };
      }
      return col;
    });
  };

  // useCallback + lodash keys/map + tartib validatsiyasi
  const handleKanbanChange = useCallback(
    (newMap) => {
      const newKeysOrder = keys(newMap);
      setDaysData((prev) => {
        const dayData = [...(prev[selectedDay] || [])];
        const oldKeysOrder = map(dayData, "id");
        const isColumnReorder =
          newKeysOrder.join(",") !== oldKeysOrder.join(",");

        let sortedDayData = map(newKeysOrder, (id) => {
          const exist = find(dayData, (c) => c.id === id);
          return { ...exist, items: newMap[id] };
        });

        if (isColumnReorder) {
          const error = validateColumnOrder(sortedDayData);
          if (error) {
            setTimeout(() => toast.error(error), 0);
            return prev; // Asl tartibga qaytarish
          }
          sortedDayData = recalculateSnackTimes(sortedDayData);
        }

        return { ...prev, [selectedDay]: sortedDayData };
      });
    },
    [selectedDay],
  );

  const addFoodToColumn = useCallback(
    (food, colId) => {
      if (!food) return;
      const newFood = {
        ...food,
        id: `food-${Date.now()}`,
        grams: food.defaultAmount || 100,
      };

      setDaysData((prev) => {
        const dayData = [...(prev[selectedDay] || [])];
        const colIndex = findIndex(dayData, { id: colId });
        if (colIndex !== -1) {
          dayData[colIndex] = {
            ...dayData[colIndex],
            items: [...dayData[colIndex].items, newFood],
          };
        }
        return { ...prev, [selectedDay]: dayData };
      });
      toast.success(`${food.name} qo'shildi`);
      setEditingFood({ ...newFood, colId });
    },
    [selectedDay],
  );

  const removeFood = useCallback(
    (colId, foodId) => {
      setDaysData((prev) => {
        const dayData = [...(prev[selectedDay] || [])];
        const colIndex = findIndex(dayData, { id: colId });
        if (colIndex !== -1) {
          dayData[colIndex] = {
            ...dayData[colIndex],
            items: reject(dayData[colIndex].items, { id: foodId }),
          };
        }
        return { ...prev, [selectedDay]: dayData };
      });
    },
    [selectedDay],
  );

  const updateColumn = useCallback(
    (colId, updates) => {
      setDaysData((prev) => {
        const dayData = [...(prev[selectedDay] || [])];
        const i = findIndex(dayData, { id: colId });
        if (i > -1) {
          dayData[i] = { ...dayData[i], ...updates };
        }
        return { ...prev, [selectedDay]: dayData };
      });
    },
    [selectedDay],
  );

  const removeColumn = useCallback(
    (colId) => {
      setDaysData((prev) => {
        const dayData = prev[selectedDay] || [];
        return { ...prev, [selectedDay]: reject(dayData, { id: colId }) };
      });
      toast.info("Vaqt o'chirildi");
    },
    [selectedDay],
  );

  const addSection = useCallback(
    (targetType) => {
      const currentData = daysData[selectedDay] || [];
      const isCore = find(CORE_MEALS, (m) => m.type === targetType);

      // Max 7 ta column
      if (currentData.length >= MAX_COLUMNS) {
        toast.error(
          `Bir kunda maksimal ${MAX_COLUMNS} ta ovqatlanish vaqti bo'lishi mumkin!`,
        );
        return;
      }

      // Max 4 ta snack (core bo'lmagan har qanday column)
      if (!isCore) {
        const snackCount = filter(
          currentData,
          (c) => !CORE_SORT_ORDER[c.type],
        ).length;
        if (snackCount >= MAX_SNACKS) {
          toast.error(
            `Bir kunda maksimal ${MAX_SNACKS} ta snack bo'lishi mumkin!`,
          );
          return;
        }
      }

      setDaysData((prev) => {
        let dayData = [...(prev[selectedDay] || [])];

        const newCol = {
          id: `col-${Date.now()}`,
          type: targetType || "Snack",
          time: isCore ? isCore.time : "16:00-17:00",
          items: [],
        };

        if (isCore) {
          dayData.push(newCol);
          dayData = sortBy(dayData, (col) => CORE_SORT_ORDER[col.type] ?? 99);
        } else {
          dayData.push(newCol);
        }

        return { ...prev, [selectedDay]: recalculateSnackTimes(dayData) };
      });
      toast.success(`${targetType || "Snack"} qo'shildi`);
    },
    [selectedDay, daysData],
  );

  const updateFoodPortion = useCallback(
    (colId, foodId, amount) => {
      setDaysData((prev) => {
        const dayData = [...(prev[selectedDay] || [])];
        const colIndex = findIndex(dayData, { id: colId });
        if (colIndex !== -1) {
          dayData[colIndex] = {
            ...dayData[colIndex],
            items: map(dayData[colIndex].items, (f) => {
              if (f.id !== foodId) return f;
              const baseFood = foodMap.get(f.barcode) || f;
              const isGrams =
                !baseFood.unit ||
                baseFood.unit === "g" ||
                baseFood.unit === "ml";
              const factor = isGrams
                ? amount / 100
                : amount / (baseFood.defaultAmount || 1);
              return {
                ...f,
                grams: amount,
                cal: Math.round((baseFood.baseCal ?? baseFood.cal ?? 0) * factor),
                protein: Math.round(
                  (baseFood.baseProtein ?? baseFood.protein ?? 0) * factor,
                ),
                carbs: Math.round(
                  (baseFood.baseCarbs ?? baseFood.carbs ?? 0) * factor,
                ),
                fat: Math.round(
                  (baseFood.baseFat ?? baseFood.fat ?? 0) * factor,
                ),
              };
            }),
          };
        }
        return { ...prev, [selectedDay]: dayData };
      });
    },
    [foodMap, selectedDay],
  );

  const calculateMacros = useCallback((baseFood, amount) => {
    const isGrams =
      !baseFood.unit || baseFood.unit === "g" || baseFood.unit === "ml";
    const factor = isGrams
      ? amount / 100
      : amount / (baseFood.defaultAmount || 1);

    return {
      cal: Math.round((baseFood.baseCal ?? baseFood.cal ?? 0) * factor),
      protein: Math.round((baseFood.baseProtein ?? baseFood.protein ?? 0) * factor),
      carbs: Math.round((baseFood.baseCarbs ?? baseFood.carbs ?? 0) * factor),
      fat: Math.round((baseFood.baseFat ?? baseFood.fat ?? 0) * factor),
    };
  }, []);

  const handleExternalDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;
      if (active.data?.current?.type === "LibraryItem") {
        const food = active.data.current.food;
        const colId = over.id;
        const targetCol =
          find(currentDayColumns, (c) => c.id === colId) ||
          find(currentDayColumns, (c) => find(c.items, (i) => i.id === colId));
        if (targetCol) addFoodToColumn(food, targetCol.id);
      }
    },
    [currentDayColumns, addFoodToColumn],
  );

  const openAddFood = useCallback((colId) => {
    setTargetColId(colId);
    setFoodLibraryOpen(true);
  }, []);

  const handleMobileSelectFood = useCallback(
    (food) => {
      if (!targetColId) return;
      addFoodToColumn(food, targetColId);
      setFoodLibraryOpen(false);
    },
    [targetColId, addFoodToColumn],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-full p-0">
        <DrawerHeader>
          <DrawerTitle className={"flex items-center md:gap-x-3"}>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              aria-label="Builderni yopish"
              className="hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 size-9 rounded-full"
            >
              <XIcon className="size-4" />
            </Button>
            <div className="flex-1 justify-center md:justify-start flex items-center gap-3">
              Plan Builder
              <SparklesIcon className="size-3.5 text-amber-500" />
            </div>
          </DrawerTitle>
          <DrawerDescription className={"text-center md:text-start"}>
            Haftalik ovqatlanish rejangizni boshqaring va tahrirlang
          </DrawerDescription>
          <div
            ref={dayScrollRef}
            className="flex gap-1.5 overflow-x-auto scrollbar-none mt-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {map(WEEK_DAYS, (day) => {
              const isActive = selectedDay === day;
              const isToday = day === getTodayDayName();
              return (
                <button
                  key={day}
                  ref={isActive ? activeDayRef : null}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 whitespace-nowrap border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                      : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground",
                    isToday && !isActive && "border-primary/40 text-primary/80",
                  )}
                >
                  {day}
                  {isToday && (
                    <span
                      className={cn(
                        "ml-1 inline-block size-1 rounded-full align-middle",
                        isActive ? "bg-primary-foreground/70" : "bg-primary",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </DrawerHeader>

        <div
          data-vaul-no-drag
          className="flex flex-col h-full animate-in fade-in duration-300 overflow-hidden"
        >
          {isMobile ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
              {map(currentDayColumns, (col, i) => (
                <MobileAccordionColumn
                  key={col.id}
                  col={col}
                  defaultOpen={i === 0}
                  calculateMacros={calculateMacros}
                  onAddFood={openAddFood}
                  onRemoveFood={removeFood}
                  onEditFood={(food) =>
                    setEditingFood({ ...food, colId: col.id })
                  }
                  onUpdateColumn={updateColumn}
                  onRemoveColumn={removeColumn}
                />
              ))}
              {missingCoreMeals.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full rounded-2xl border-dashed border-2 h-14 bg-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-all font-bold group"
                      variant="outline"
                    >
                      <PlusIcon className="size-5 mr-2 group-hover:scale-125 transition-transform" />
                      <span>Yangi vaqt qo'shish</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="w-64 rounded-2xl p-2 border-border/50 shadow-xl backdrop-blur-xl bg-card/90"
                  >
                    {map(missingCoreMeals, (meal) => (
                      <DropdownMenuItem
                        key={meal.type}
                        onClick={() => addSection(meal.type)}
                        className="py-3 px-4 cursor-pointer rounded-xl font-bold focus:bg-primary/10 focus:text-primary transition-colors"
                      >
                        <PlusIcon className="size-4 mr-3" /> {meal.type}{" "}
                        qo'shish
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={() => addSection("Snack")}
                      className="py-3 px-4 cursor-pointer text-muted-foreground rounded-xl font-bold focus:bg-muted focus:text-foreground transition-colors"
                    >
                      <PlusIcon className="size-4 mr-3" /> Snack qo'shish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  className="w-full rounded-2xl border-dashed border-2 h-14 bg-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-all font-bold group"
                  variant="outline"
                  onClick={() => addSection("Snack")}
                >
                  <PlusIcon className="size-5 mr-2 group-hover:scale-125 transition-transform" />
                  <span>Snack qo'shish</span>
                </Button>
              )}
            </div>
          ) : (
            /* DESKTOP: Kanban layout (unchanged) */
            <div className="flex-1 flex overflow-hidden">
              <Kanban
                value={kanbanColumns}
                onValueChange={handleKanbanChange}
                getItemValue={(item) => item.id}
                onDragEnd={handleExternalDragEnd}
                className="flex w-full h-full overflow-hidden"
              >
                <div className="relative flex shrink-0 h-full overflow-hidden">
                  <div
                    className={cn(
                      "border-r flex flex-col h-full transition-all duration-300 overflow-hidden",
                      isSidebarOpen ? "w-72 sm:w-96" : "w-0 border-r-0",
                    )}
                  >
                    <div className="p-4 border-b border-border/40 shrink-0 space-y-4 bg-background/30 backdrop-blur-md">
                      <div className="relative group">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="Ovqat qidirish..."
                          className="pl-10 h-11 bg-background/50 border-border/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all shadow-sm"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 mask-edges -mx-4 px-4">
                        {map(categoriesWithAll, (category) => (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={selectedCategoryId === category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className={cn(
                              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border shrink-0",
                              selectedCategoryId === category.id
                                ? "bg-foreground text-background border-foreground shadow-sm scale-105"
                                : "bg-background/80 text-muted-foreground border-border/40 hover:bg-muted/80 hover:border-border/60",
                            )}
                          >
                            {category.label}{" "}
                            <span
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-md",
                                selectedCategoryId === category.id
                                  ? "bg-background/20 text-background"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {categoryCounts.get(category.id) || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                      {isCatalogLoading ? (
                        <div className="flex h-full min-h-40 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                          Ovqat katalogi yuklanmoqda...
                        </div>
                      ) : isCatalogError ? (
                        <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">
                            Katalogni yuklab bo'lmadi
                          </p>
                          <p className="mt-1">Keyinroq qayta urinib ko'ring.</p>
                        </div>
                      ) : filteredLibraryFoods.length === 0 ? (
                        <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">
                            Katalog bo'sh
                          </p>
                          <p className="mt-1">
                            Hozircha faol ovqatlar topilmadi.
                          </p>
                        </div>
                      ) : (
                        map(filteredLibraryFoods, (food) => {
                          const defaultCol =
                            find(
                              currentDayColumns,
                              (c) => c.type === "Nonushta",
                            ) || currentDayColumns[0];
                          return (
                            <LibraryItem
                              key={`lib-${food.barcode}`}
                              food={food}
                              onAdd={() =>
                                defaultCol
                                  ? addFoodToColumn(food, defaultCol.id)
                                  : toast.error(
                                      "Kechirasiz, avval bironta vaqt qo'shing.",
                                    )
                              }
                            />
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    aria-label={
                      isSidebarOpen
                        ? "Kutubxonani yopish"
                        : "Kutubxonani ochish"
                    }
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute right-[-24px] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-6 h-12 bg-background border border-border/50 shadow-sm rounded-r-lg hover:bg-muted/50 transition-colors"
                  >
                    {isSidebarOpen ? (
                      <ChevronLeftIcon className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Main Area: Kanban Board */}
                <div className="flex-1 overflow-x-auto bg-muted/10 p-4 pt-4 flex gap-6 custom-scrollbar">
                  <KanbanBoard className="flex gap-6 sm:grid-cols-none auto-rows-auto">
                    {map(currentDayColumns, (col) => (
                      <BuilderColumn
                        key={col.id}
                        col={col}
                        onRemoveFood={removeFood}
                        onEditFood={(food) =>
                          setEditingFood({ ...food, colId: col.id })
                        }
                        calculateMacros={calculateMacros}
                        updateColumn={updateColumn}
                        removeColumn={removeColumn}
                      />
                    ))}

                    {missingCoreMeals.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="w-72 sm:w-96 rounded-2xl border-dashed border-2 h-20 bg-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-all font-bold group"
                            variant="outline"
                          >
                            <PlusIcon className="size-5 mr-2 group-hover:scale-125 transition-transform" />
                            <span>Yangi vaqt qo'shish</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="center"
                          className="w-64 rounded-2xl p-2 border-border/50 shadow-xl backdrop-blur-xl bg-card/90"
                        >
                          {map(missingCoreMeals, (meal) => (
                            <DropdownMenuItem
                              key={meal.type}
                              onClick={() => addSection(meal.type)}
                              className="py-3 px-4 cursor-pointer rounded-xl font-bold focus:bg-primary/10 focus:text-primary transition-colors"
                            >
                              <PlusIcon className="size-4 mr-3" /> {meal.type}{" "}
                              qo'shish
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => addSection("Snack")}
                            className="py-3 px-4 cursor-pointer text-muted-foreground rounded-xl font-bold focus:bg-muted focus:text-foreground transition-colors"
                          >
                            <PlusIcon className="size-4 mr-3" /> Snack qo'shish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        className="w-72 sm:w-96 rounded-2xl border-dashed border-2 h-20 bg-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-all font-bold group"
                        variant="outline"
                        onClick={() => addSection("Snack")}
                      >
                        <PlusIcon className="size-5 mr-2 group-hover:scale-125 transition-transform" />
                        <span>Snack qo'shish</span>
                      </Button>
                    )}
                  </KanbanBoard>

                  <KanbanOverlay>
                    {({ value, variant }) => {
                      if (variant === "column") {
                        const c = find(
                          currentDayColumns,
                          (col) => col.id === value,
                        );
                        return c ? (
                          <Card className="bg-primary text-primary-foreground p-3 rounded-xl shadow-2xl flex items-center gap-3 w-64 rotate-3 border-2 border-white/20">
                            <span className="font-bold">
                              {c.type} ko'chirilmoqda...
                            </span>
                          </Card>
                        ) : null;
                      }
                      if (
                        typeof value === "string" &&
                        value.startsWith("food-")
                      ) {
                        const food = libraryFoodById.get(value);
                        if (food) {
                          return (
                            <Card className="py-2 px-4 flex items-center gap-3 w-80 shadow-2xl rotate-2 border-primary/40 bg-card">
                              <div className="size-11 rounded-xl bg-muted/50 flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-border/40">
                                {food.image ? (
                                  <img loading="lazy"
                                    src={food.image}
                                    alt={food.name}
                                    width={44}
                                    height={44}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{food.emoji}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black truncate text-foreground/90">
                                  {food.name}
                                </p>
                                <p className="text-[9px] text-muted-foreground/80 uppercase font-black tracking-widest mt-0.5">
                                  {food.brand || "Tabiiy"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/10 shrink-0">
                                <FlameIcon className="size-3 text-orange-500" />{" "}
                                {food.cal}
                              </div>
                            </Card>
                          );
                        }
                      }
                      return (
                        <Card className="bg-primary text-primary-foreground p-3 rounded-xl shadow-2xl flex items-center gap-3 w-64 rotate-3 border-2 border-white/20">
                          <span className="font-bold">
                            Ovqat ko'chirilmoqda...
                          </span>
                        </Card>
                      );
                    }}
                  </KanbanOverlay>
                </div>
              </Kanban>
            </div>
          )}
          <PortionEditorDrawer
            food={editingFood}
            onClose={() => setEditingFood(null)}
            onSave={updateFoodPortion}
            calculateMacros={calculateMacros}
            dailyGoals={DAILY_GOALS}
          />

          <MobileFoodLibraryDrawer
            open={foodLibraryOpen}
            onClose={() => setFoodLibraryOpen(false)}
            onSelect={handleMobileSelectFood}
            categories={categoriesWithAll}
            foods={foods}
            isLoading={isCatalogLoading}
            isError={isCatalogError}
          />
        </div>
        <DrawerFooter>
          <Button onClick={() => onSave(daysData)}>Saqlash</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default Index;
