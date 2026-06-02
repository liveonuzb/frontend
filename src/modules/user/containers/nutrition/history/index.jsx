import React from "react";
import { useNavigate } from "react-router";
import {
  CalendarDaysIcon,
  Clock3Icon,
  CheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import CalendarBottomDrawer from "@/components/calendar-bottom-drawer.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  getTodayKey,
  useDailyTrackingActions,
  useDailyTrackingHistory,
} from "@/hooks/app/use-daily-tracking";
import { toast } from "sonner";
import {
  MEAL_ICONS,
  MEAL_LABELS,
  MEAL_TYPE_OPTIONS,
} from "@/modules/user/lib/meal-config";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import ProgressBar, { getProgressPercent } from "../ui/progress-bar.jsx";
import { cn } from "@/lib/utils.js";

import filter from "lodash/filter";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import map from "lodash/map";
import orderBy from "lodash/orderBy";
import reduce from "lodash/reduce";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import toPairs from "lodash/toPairs";
import trim from "lodash/trim";

const mealTypeOptions = [
  { value: "all", label: "Barcha bo'limlar" },
  ...MEAL_TYPE_OPTIONS,
];

const toDateKey = (date) => date.toISOString().slice(0, 10);

const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toDateKey(date);
};

const flattenMeals = (day) =>
  toPairs(day?.meals || {}).flatMap(([mealType, items]) =>
    map((isArray(items) ? items : []), (item) => ({
      ...item,
      mealType,
    })),
  );

const getDayTotals = (meals) =>
  reduce(meals, (totals, meal) => ({
    calories: totals.calories + toNumber(meal.cal || 0),
    protein: totals.protein + toNumber(meal.protein || 0),
    carbs: totals.carbs + toNumber(meal.carbs || 0),
    fat: totals.fat + toNumber(meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

const getDayWaterMl = (day) => {
  const waterLog = isArray(day?.waterLog) ? day.waterLog : [];
  if (waterLog.length > 0) {
    return reduce(waterLog, (sum, entry) => sum + toNumber(entry?.amountMl || 0), 0);
  }
  return toNumber(day?.waterMl || day?.summary?.waterMl || 0);
};

const normalizeSearch = (value) => toLower(trim(String(value || "")));

const filterMealsForView = (meals, mealType, search) => {
  const searchTerm = normalizeSearch(search);

  return filter(meals, (meal) => {
    if (mealType && mealType !== "all" && meal.mealType !== mealType) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    return includes(
      toLower(
        [
          meal.name,
          meal.barcode,
          meal.source,
          MEAL_LABELS[meal.mealType],
        ]
          .filter(Boolean)
          .join(" "),
      ),
      searchTerm,
    );
  });
};

const formatDateLabel = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatShortDateLabel = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
  });

const formatDateInputLabel = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const dateKeyToDate = (dateKey) => new Date(`${dateKey}T12:00:00`);

const getMealTimeMs = (meal, fallbackDateKey) => {
  const value = meal?.addedAt || `${fallbackDateKey}T12:00:00`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const formatMealTime = (meal, fallbackDateKey) => {
  const value = meal?.addedAt || `${fallbackDateKey}T12:00:00`;
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--:--";
  }

  return parsed.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const downloadCsv = (filename, rows) => {
  if (typeof document === "undefined") return;

  const csv = map(rows, (row) => map(row, escapeCsvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const FilterTrigger = ({
  startDate,
  endDate,
  mealType,
  search,
  isFetching,
  onOpen,
}) => {
  const selectedMeal = mealTypeOptions.find((option) => option.value === mealType);
  const activeCount =
    (mealType !== "all" ? 1 : 0) +
    (trim(search) ? 1 : 0);

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        className="min-h-12 flex-1 justify-between rounded-[1.4rem] border-[rgb(var(--accent-rgb)/0.18)] bg-card/90 px-4 shadow-sm shadow-black/[0.03] sm:flex-none sm:min-w-[22rem]"
        onClick={onOpen}
        aria-label="Filtr"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <SlidersHorizontalIcon className="size-4" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-black">Filtr</span>
            <span className="block truncate text-xs font-semibold text-muted-foreground">
              {formatDateInputLabel(startDate)} - {formatDateInputLabel(endDate)}
              {" • "}
              {selectedMeal?.label || "Barcha bo'limlar"}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
          {isFetching ? (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          )}
        </span>
      </Button>
    </div>
  );
};

const HistoryFilterDrawer = ({
  open,
  onOpenChange,
  startDate,
  endDate,
  mealType,
  search,
  isExportDisabled,
  onOpenStartDate,
  onOpenEndDate,
  onOpenMealType,
  onSearchChange,
  onExport,
  onClear,
}) => {
  const selectedMeal = mealTypeOptions.find((option) => option.value === mealType);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Tarix filterlari</DrawerTitle>
          <DrawerDescription>
            Sana oralig'i, ovqat bo'limi va qidiruvni shu yerda sozlang.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-3 px-4 pb-0">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 text-left"
            onClick={onOpenStartDate}
            aria-label="Boshlanish sanasi"
          >
            <span>
              <span className="block text-xs font-bold uppercase text-muted-foreground">
                Boshlanish sanasi
              </span>
              <span className="mt-1 block text-base font-black">
                {formatDateInputLabel(startDate)}
              </span>
            </span>
            <CalendarDaysIcon className="size-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 text-left"
            onClick={onOpenEndDate}
            aria-label="Tugash sanasi"
          >
            <span>
              <span className="block text-xs font-bold uppercase text-muted-foreground">
                Tugash sanasi
              </span>
              <span className="mt-1 block text-base font-black">
                {formatDateInputLabel(endDate)}
              </span>
            </span>
            <CalendarDaysIcon className="size-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 text-left"
            onClick={onOpenMealType}
            aria-label="Bo'lim"
          >
            <span>
              <span className="block text-xs font-bold uppercase text-muted-foreground">
                Bo'lim
              </span>
              <span className="mt-1 block text-base font-black">
                {selectedMeal?.label || "Barcha bo'limlar"}
              </span>
            </span>
            <ChevronRightIcon className="size-5 text-muted-foreground" />
          </button>

          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Ovqat nomi..."
              className="h-12 rounded-3xl pl-11"
            />
          </div>
        </DrawerBody>

        <DrawerFooter className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onClear}
          >
            Tozalash
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={isExportDisabled}
            onClick={onExport}
          >
            CSV yuklash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const MealTypeDrawer = ({
  open,
  onOpenChange,
  value,
  onChange,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom" nested>
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
      <DrawerHeader>
        <DrawerTitle>Bo'limni tanlang</DrawerTitle>
        <DrawerDescription>
          Tarix ro'yxati qaysi ovqat bo'limini ko'rsatishini tanlang.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="space-y-2 px-4 pb-6">
        {map(mealTypeOptions, (option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-left text-sm font-black transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-card hover:bg-muted/40",
              )}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
            >
              <span>{option.label}</span>
              {active ? <CheckIcon className="size-4" /> : null}
            </button>
          );
        })}
      </DrawerBody>
    </DrawerContent>
  </Drawer>
);

const HistoryDayCard = ({
  day,
  meals,
  totals,
  onOpen,
  onCopyMealToToday,
}) => {
  const targetCalories = toNumber(day?.goals?.calories || day?.targetCalories || 0);
  const waterMl = getDayWaterMl(day);
  const progress = targetCalories > 0
    ? getProgressPercent(totals.calories, targetCalories)
    : 0;
  const mealCount = meals.length;
  const healthScore = Math.min(100, Math.round((progress > 0 ? Math.min(progress, 100) * 0.6 : 0) + (mealCount >= 3 ? 25 : mealCount * 8) + (waterMl > 0 ? 15 : 0)));
  const hasMeals = mealCount > 0;
  const timelineMeals = orderBy(
    meals,
    [(meal) => getMealTimeMs(meal, day.date)],
    ["asc"],
  );

  return (
    <article
      role="button"
      tabIndex={0}
      className="w-full cursor-pointer rounded-[28px] border border-[rgb(var(--accent-rgb)/0.14)] bg-card/95 p-4 text-left shadow-sm shadow-black/[0.03] transition-colors hover:border-[rgb(var(--accent-rgb)/0.28)] hover:bg-[rgb(var(--accent-rgb)/0.03)] sm:p-5"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onOpen();
        }
      }}
    >
      <div className="grid gap-5 xl:grid-cols-[190px_1fr_auto] xl:items-start">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            {formatShortDateLabel(day.date)}
          </p>
          <h3 className="mt-1 text-lg font-black capitalize">
            {formatDateLabel(day.date)}
          </h3>
          <p className="mt-3 text-3xl font-black tabular-nums">
            {Math.round(totals.calories)} kcal
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {hasMeals ? `${mealCount} ta ovqat` : "Ovqat qo'shilmagan"}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
              Sog'liq {healthScore}/100
            </span>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-muted-foreground">
                Maqsad: {targetCalories || "—"} kcal
              </p>
              <p className="text-xs font-black text-primary">{progress}%</p>
            </div>
            <ProgressBar
              value={totals.calories}
              target={targetCalories}
              aria-label={`${day.date} kaloriya progress`}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {map([
              ["Oqsil", `${Math.round(totals.protein)}g`],
              ["Uglevod", `${Math.round(totals.carbs)}g`],
              ["Yog'", `${Math.round(totals.fat)}g`],
              ["Suv", `${Math.round(waterMl)} ml`],
            ], ([label, value]) => (
              <div key={label} className="rounded-2xl bg-muted/40 px-3 py-2">
                <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-black">{value}</p>
              </div>
            ))}
          </div>
          <div className="relative space-y-2 pl-4 before:absolute before:bottom-2 before:left-[6px] before:top-2 before:w-px before:bg-border">
            {hasMeals ? (
              map(timelineMeals, (meal) => {
                const mealIcon = MEAL_ICONS[meal.mealType] || "🍽️";
                const mealLabel = MEAL_LABELS[meal.mealType] || meal.mealType;

                return (
                  <div
                    key={`${day.date}-${meal.mealType}-${meal.id}`}
                    className="relative grid gap-3 rounded-2xl bg-muted/25 p-3 sm:grid-cols-[68px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="absolute -left-[14px] top-4 grid size-3 place-items-center rounded-full border-2 border-card bg-primary" />
                    <div className="flex items-center gap-1.5 text-xs font-black tabular-nums text-primary">
                      <Clock3Icon className="size-3.5" />
                      {formatMealTime(meal, day.date)}
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-background text-lg">
                        {meal.image ? (
                          <img
                            src={meal.image}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span aria-hidden="true">{mealIcon}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black">
                            {meal.name || "Ovqat"}
                          </p>
                          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {mealLabel}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                          P {Math.round(toNumber(meal.protein || 0))}g · C{" "}
                          {Math.round(toNumber(meal.carbs || 0))}g · F{" "}
                          {Math.round(toNumber(meal.fat || 0))}g
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-black tabular-nums">
                          {Math.round(toNumber(meal.cal || 0))}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">
                          kcal
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full bg-background"
                        onClick={(event) => onCopyMealToToday(event, meal)}
                        aria-label={`${meal.name || "Ovqat"} bugunga qo'shish`}
                      >
                        <PlusIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="relative rounded-2xl border border-dashed bg-muted/15 px-3 py-4 text-sm font-semibold text-muted-foreground">
                <span className="absolute -left-[14px] top-5 grid size-3 rounded-full border-2 border-card bg-muted" />
                Bu kunda ovqat yozilmagan
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 xl:flex-col">
          <Button type="button" variant="outline" className="rounded-full" onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}>
            Ko'rish
          </Button>
        </div>
      </div>
    </article>
  );
};

const NutritionHistoryPage = () => {
  const navigate = useNavigate();
  const todayKey = getTodayKey();
  const [startDate, setStartDate] = React.useState(getDefaultStartDate);
  const [endDate, setEndDate] = React.useState(todayKey);
  const [mealType, setMealType] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [startDatePickerOpen, setStartDatePickerOpen] = React.useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = React.useState(false);
  const [mealTypeDrawerOpen, setMealTypeDrawerOpen] = React.useState(false);
  const { addMeal } = useDailyTrackingActions();

  const { days, isLoading, isFetching, isError, refetch } =
    useDailyTrackingHistory({
      startDate,
      endDate,
      mealType,
      q: search,
    });

  const handleCopyMealToToday = async (event, meal) => {
    event.stopPropagation();

    try {
      await addMeal(todayKey, meal.mealType, {
        ...meal,
        id: undefined,
        source: "history-copy",
        addedAt: undefined,
      });
      toast.success(`${meal.name} bugunga qo'shildi`);
    } catch {
      toast.error("Ovqatni bugunga qo'shib bo'lmadi");
    }
  };
  const handleExportHistory = React.useCallback(() => {
    const rows = [
      ["date", "meal_type", "food_name", "calories", "protein_g", "carbs_g", "fat_g", "water_ml"],
    ];

    map(days, (day) => {
      const meals = flattenMeals(day);
      const waterMl = getDayWaterMl(day);

      if (meals.length === 0) {
        rows.push([day.date, "", "", 0, 0, 0, 0, waterMl]);
        return;
      }

      map(meals, (meal) => {
        rows.push([
          day.date,
          meal.mealType,
          meal.name || "",
          Math.round(toNumber(meal.cal || 0)),
          Math.round(toNumber(meal.protein || 0)),
          Math.round(toNumber(meal.carbs || 0)),
          Math.round(toNumber(meal.fat || 0)),
          waterMl,
        ]);
      });
    });

    downloadCsv(`nutrition-history-${startDate}-${endDate}.csv`, rows);
  }, [days, endDate, startDate]);
  const handleStartDateChange = React.useCallback(
    (nextDate) => {
      const nextKey = toDateKey(nextDate);
      setStartDate(nextKey);
      if (nextKey > endDate) {
        setEndDate(nextKey);
      }
    },
    [endDate],
  );
  const handleEndDateChange = React.useCallback(
    (nextDate) => {
      const nextKey = toDateKey(nextDate);
      setEndDate(nextKey);
      if (nextKey < startDate) {
        setStartDate(nextKey);
      }
    },
    [startDate],
  );
  const handleClearFilters = React.useCallback(() => {
    setStartDate(getDefaultStartDate());
    setEndDate(todayKey);
    setMealType("all");
    setSearch("");
  }, [todayKey]);

  return (
    <NutritionLayout>
      <FilterTrigger
        startDate={startDate}
        endDate={endDate}
        mealType={mealType}
        search={search}
        isFetching={isFetching}
        onOpen={() => setFilterOpen(true)}
      />

      {isLoading ? (
        <div className="grid min-h-[260px] place-items-center rounded-[1.75rem] border bg-card">
          <div className="text-center">
            <Loader2Icon className="mx-auto mb-3 size-7 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground">
              Tarix yuklanmoqda
            </p>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-[1.75rem] border bg-card p-8 text-center">
          <h2 className="text-lg font-black">Tarixni yuklab bo'lmadi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keyinroq qayta urinib ko'ring.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Qayta urinish
          </Button>
        </div>
      ) : days.length === 0 ? (
        <div className="rounded-[1.75rem] border bg-card p-8 text-center">
          <CalendarDaysIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2 className="text-lg font-black">Natija topilmadi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sana oralig'i yoki qidiruv so'zini o'zgartiring.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {map(days, (day) => {
            const meals = filterMealsForView(flattenMeals(day), mealType, search);
            const totals = getDayTotals(meals);

            return (
              <HistoryDayCard
                key={day.date}
                day={day}
                meals={meals}
                totals={totals}
                onOpen={() => navigate(`/user/nutrition/overview?date=${day.date}`)}
                onCopyMealToToday={handleCopyMealToToday}
              />
            );
          })}
        </div>
      )}
      <HistoryFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        startDate={startDate}
        endDate={endDate}
        mealType={mealType}
        search={search}
        isExportDisabled={isLoading || days.length === 0}
        onOpenStartDate={() => setStartDatePickerOpen(true)}
        onOpenEndDate={() => setEndDatePickerOpen(true)}
        onOpenMealType={() => setMealTypeDrawerOpen(true)}
        onSearchChange={setSearch}
        onExport={handleExportHistory}
        onClear={handleClearFilters}
      />
      {startDatePickerOpen ? (
        <CalendarBottomDrawer
          open={startDatePickerOpen}
          onOpenChange={setStartDatePickerOpen}
          date={dateKeyToDate(startDate)}
          onChange={handleStartDateChange}
          maxDate={dateKeyToDate(endDate)}
          title="Boshlanish sanasi"
          description="Tarix ko'rinishi qaysi kundan boshlanishini tanlang."
          nested
        />
      ) : null}
      {endDatePickerOpen ? (
        <CalendarBottomDrawer
          open={endDatePickerOpen}
          onOpenChange={setEndDatePickerOpen}
          date={dateKeyToDate(endDate)}
          onChange={handleEndDateChange}
          minDate={dateKeyToDate(startDate)}
          maxDate={dateKeyToDate(todayKey)}
          title="Tugash sanasi"
          description="Tarix ko'rinishi qaysi kungacha bo'lishini tanlang."
          nested
        />
      ) : null}
      {mealTypeDrawerOpen ? (
        <MealTypeDrawer
          open={mealTypeDrawerOpen}
          onOpenChange={setMealTypeDrawerOpen}
          value={mealType}
          onChange={setMealType}
        />
      ) : null}
    </NutritionLayout>
  );
};

export default NutritionHistoryPage;
