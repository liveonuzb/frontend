import React from "react";
import { useNavigate } from "react-router";
import {
  CalendarDaysIcon,
  DropletsIcon,
  FlameIcon,
  HistoryIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getTodayKey,
  useDailyTrackingActions,
  useDailyTrackingHistory,
} from "@/hooks/app/use-daily-tracking";
import { toast } from "sonner";
import { MEAL_TYPE_OPTIONS } from "@/modules/user/lib/meal-config";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionPageHeader from "../ui/nutrition-page-header.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import StatCard from "../ui/stat-card.jsx";
import ProgressBar, { getProgressPercent } from "../ui/progress-bar.jsx";

import { filter, map, orderBy, reduce, take, toPairs, isArray, toNumber } from "lodash";

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

const formatDateLabel = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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

const HistoryDayCard = ({
  day,
  meals,
  totals,
  topMeals,
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

  return (
    <article
      role="button"
      tabIndex={0}
      className="w-full cursor-pointer rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/5 sm:p-5"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onOpen();
        }
      }}
    >
      <div className="grid gap-5 xl:grid-cols-[190px_1fr_auto] xl:items-start">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {formatDateLabel(day.date)}
          </p>
          <h3 className="mt-2 text-3xl font-black tabular-nums">
            {Math.round(totals.calories)} kcal
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {hasMeals ? `${mealCount} ta ovqat` : "Ovqat qo'shilmagan"}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
              Health {healthScore}/100
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
          <div className="flex flex-wrap gap-2">
            {hasMeals ? map(topMeals, (meal) => (
              <span
                key={`${day.date}-${meal.mealType}-${meal.id}`}
                className="inline-flex max-w-full items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs font-bold"
              >
                <span className="max-w-[180px] truncate">{meal.name}</span>
                <span className="text-muted-foreground">
                  {Math.round(meal.cal || 0)} kcal
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-6 rounded-full"
                  onClick={(event) => onCopyMealToToday(event, meal)}
                  aria-label={`${meal.name} bugunga qo'shish`}
                >
                  <PlusIcon className="size-3.5" />
                </Button>
              </span>
            )) : (
              <span className="rounded-2xl border border-dashed px-3 py-2 text-xs font-bold text-muted-foreground">
                0 kcal, ovqatlar qo'shilmagan, maqsadga yetmadi
              </span>
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
          <Button type="button" variant="outline" className="rounded-full" disabled={!hasMeals}>
            Takrorlash
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
  const historyStats = React.useMemo(() => {
    const daySummaries = map(days, (day) => {
      const meals = flattenMeals(day);
      return {
        meals,
        totals: getDayTotals(meals),
        waterMl: getDayWaterMl(day),
      };
    });
    const loggedDays = filter(daySummaries, (day) => day.totals.calories > 0);
    const avgCalories = loggedDays.length
      ? Math.round(reduce(loggedDays, (sum, day) => sum + day.totals.calories, 0) / loggedDays.length)
      : 0;
    const avgWater = daySummaries.length
      ? Math.round(reduce(daySummaries, (sum, day) => sum + day.waterMl, 0) / daySummaries.length)
      : 0;
    const avgBalance = loggedDays.length
      ? Math.round(reduce(loggedDays, (sum, day) => sum + Math.min(100, day.meals.length * 25), 0) / loggedDays.length)
      : 0;

    return {
      avgCalories,
      avgWater,
      avgBalance,
      trackedDays: loggedDays.length,
    };
  }, [days]);

  return (
    <NutritionLayout>
      <NutritionPageHeader
        eyebrow="Ovqatlanish"
        title="Ovqat tarixi"
        description="Kunlik ovqatlar, kaloriyalar, suv va makro balansni tarix bo'yicha ko'ring."
        actions={(
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isLoading || days.length === 0}
            onClick={handleExportHistory}
          >
            Export
          </Button>
        )}
      />

      <NutritionCard className="p-4 sm:p-5">
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_190px_1.4fr]">
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            aria-label="Boshlanish sanasi"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            aria-label="Tugash sanasi"
          />
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger>
              <SelectValue placeholder="Meal type" />
            </SelectTrigger>
            <SelectContent>
              {map(mealTypeOptions, (option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ovqat nomi..."
              className="pl-9"
            />
          </div>
        </div>
      </NutritionCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FlameIcon}
          label="O'rtacha kaloriya"
          value={historyStats.avgCalories}
          unit="kcal"
        />
        <StatCard
          icon={TrophyIcon}
          label="Eng yaxshi seriya"
          value={historyStats.trackedDays}
          unit="kun"
          tone="success"
        />
        <StatCard
          icon={DropletsIcon}
          label="O'rtacha suv"
          value={historyStats.avgWater}
          unit="ml"
          tone="water"
        />
        <StatCard
          icon={TargetIcon}
          label="O'rtacha balans"
          value={historyStats.avgBalance}
          unit="%"
          tone="warning"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Kunlik tarix</h2>
          <p className="text-sm text-muted-foreground">
            {startDate} dan {endDate} gacha
          </p>
        </div>
        {isFetching ? (
          <p className="text-xs font-bold text-muted-foreground">Yangilanmoqda...</p>
        ) : null}
      </div>

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
            const meals = flattenMeals(day);
            const totals = getDayTotals(meals);
            const topMeals = take(
              orderBy(meals, [(meal) => toNumber(meal.cal || 0)], ["desc"]),
              3,
            );

            return (
              <HistoryDayCard
                key={day.date}
                day={day}
                meals={meals}
                totals={totals}
                topMeals={topMeals}
                onOpen={() => navigate(`/user/nutrition/home?date=${day.date}`)}
                onCopyMealToToday={handleCopyMealToToday}
              />
            );
          })}
        </div>
      )}
    </NutritionLayout>
  );
};

export default NutritionHistoryPage;
