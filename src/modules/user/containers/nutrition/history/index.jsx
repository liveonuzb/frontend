import React from "react";
import { useNavigate } from "react-router";
import {
  CalendarDaysIcon,
  HistoryIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
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
  Object.entries(day?.meals || {}).flatMap(([mealType, items]) =>
    (Array.isArray(items) ? items : []).map((item) => ({
      ...item,
      mealType,
    })),
  );

const getDayTotals = (meals) =>
  meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + Number(meal.cal || 0),
      protein: totals.protein + Number(meal.protein || 0),
      carbs: totals.carbs + Number(meal.carbs || 0),
      fat: totals.fat + Number(meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

const formatDateLabel = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-[1.75rem] border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <HistoryIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-black">Ovqat tarixi</h1>
            <p className="text-sm text-muted-foreground">
              O'tgan kunlar bo'yicha qidirish va solishtirish.
            </p>
          </div>
        </div>

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
              {mealTypeOptions.map((option) => (
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
          {isFetching ? (
            <div className="text-center text-xs font-bold text-muted-foreground">
              Yangilanmoqda...
            </div>
          ) : null}
          {days.map((day) => {
            const meals = flattenMeals(day);
            const totals = getDayTotals(meals);
            const topMeals = [...meals]
              .sort((left, right) => Number(right.cal || 0) - Number(left.cal || 0))
              .slice(0, 3);

            return (
              <article
                key={day.date}
                role="button"
                tabIndex={0}
                className="w-full cursor-pointer rounded-[1.75rem] border bg-card p-4 text-left transition-colors hover:bg-accent/35 sm:p-5"
                onClick={() => navigate(`/user/nutrition/home?date=${day.date}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/user/nutrition/home?date=${day.date}`);
                  }
                }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      {formatDateLabel(day.date)}
                    </p>
                    <h3 className="mt-1 text-2xl font-black tabular-nums">
                      {Math.round(totals.calories)} kcal
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      Oqsil {Math.round(totals.protein)}g • Uglevod{" "}
                      {Math.round(totals.carbs)}g • Yog' {Math.round(totals.fat)}g
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:max-w-xl md:justify-end">
                    {topMeals.map((meal) => (
                      <span
                        key={`${day.date}-${meal.mealType}-${meal.id}`}
                        className="inline-flex max-w-full items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs font-bold"
                      >
                        <span className="max-w-[160px] truncate">{meal.name}</span>
                        <span className="text-muted-foreground">
                          {Math.round(meal.cal || 0)} kcal
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-6 rounded-full"
                          onClick={(event) => handleCopyMealToToday(event, meal)}
                        >
                          <PlusIcon className="size-3.5" />
                        </Button>
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NutritionHistoryPage;
