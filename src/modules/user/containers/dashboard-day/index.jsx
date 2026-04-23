import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useGetQuery from "@/hooks/api/use-get-query";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import CalorieGaugeWidget from "@/modules/user/containers/dashboard/calorie-gauge-widget.jsx";
import MealsWidget from "@/modules/user/containers/dashboard/meals-widget.jsx";
import WaterWidget from "@/modules/user/containers/dashboard/water-widget.jsx";
import MoodWidget from "@/modules/user/containers/dashboard/mood-widget.jsx";
import WorkoutWidget from "@/modules/user/containers/dashboard/workout-widget.jsx";
import {
  calculateMealCalories,
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  normalizeDateKey,
} from "@/modules/user/containers/dashboard/query-helpers.js";

const DAY_LABELS = ["D", "S", "Ch", "P", "J", "Sh", "Ya"];

const parseDateKey = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return new Date();
  }

  return date;
};

const startOfLocalDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const clampToToday = (date) => {
  const today = startOfLocalDay(new Date());
  const next = startOfLocalDay(date);
  return next > today ? today : next;
};

const isSameLocalDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getRelativeDateTitle = (date) => {
  const today = startOfLocalDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameLocalDay(date, today)) return "Bugun";
  if (isSameLocalDay(date, yesterday)) return "Kecha";

  return date.toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const getWeekDates = (date) => {
  const start = startOfLocalDay(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const item = new Date(start);
    item.setDate(start.getDate() + index);
    return item;
  });
};

const DashboardDayContainer = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = React.useMemo(
    () => clampToToday(parseDateKey(searchParams.get("date"))),
    [searchParams],
  );
  const dateKey = React.useMemo(
    () => normalizeDateKey(selectedDate),
    [selectedDate],
  );
  const today = React.useMemo(() => startOfLocalDay(new Date()), []);
  const isAtToday = isSameLocalDay(selectedDate, today);
  const weekDates = React.useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const { data: trackingData } = useGetQuery({
    url: `/daily-tracking/${dateKey}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: Boolean(dateKey),
    },
  });
  const dayData = React.useMemo(
    () => getDayDataFromResponse(trackingData, dateKey),
    [dateKey, trackingData],
  );
  const hasLoggedFood = calculateMealCalories(dayData.meals) > 0;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/dashboard", title: "Dashboard" },
      { url: `/user/dashboard/day?date=${dateKey}`, title: "Kunlik ko'rinish" },
    ]);
  }, [dateKey, setBreadcrumbs]);

  React.useEffect(() => {
    if (searchParams.get("date") !== dateKey) {
      setSearchParams({ date: dateKey }, { replace: true });
    }
  }, [dateKey, searchParams, setSearchParams]);

  const setDate = React.useCallback(
    (nextDate) => {
      const nextKey = normalizeDateKey(clampToToday(nextDate));
      setSearchParams({ date: nextKey });
    },
    [setSearchParams],
  );

  const shiftDate = React.useCallback(
    (days) => {
      const next = new Date(selectedDate);
      next.setDate(selectedDate.getDate() + days);
      setDate(next);
    },
    [selectedDate, setDate],
  );

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-24">
        <header className="rounded-[2rem] bg-muted/40 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 rounded-full"
              onClick={() => shiftDate(-1)}
              aria-label="Oldingi kun"
            >
              <ChevronLeftIcon className="size-5" />
            </Button>

            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => setDate(new Date())}
            >
              <p className="text-3xl font-black tracking-tight sm:text-4xl">
                {getRelativeDateTitle(selectedDate)}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {selectedDate.toLocaleDateString("uz-UZ", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 rounded-full"
              disabled={isAtToday}
              onClick={() => shiftDate(1)}
              aria-label="Keyingi kun"
            >
              <ChevronRightIcon className="size-6" />
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {weekDates.map((date, index) => {
              const isSelected = isSameLocalDay(date, selectedDate);
              const isFuture = startOfLocalDay(date) > today;

              return (
                <button
                  key={normalizeDateKey(date)}
                  type="button"
                  disabled={isFuture}
                  onClick={() => setDate(date)}
                  className={cn(
                    "flex min-h-20 flex-col items-center justify-center rounded-2xl border text-center transition-all disabled:cursor-not-allowed disabled:opacity-35",
                    isSelected
                      ? "border-background bg-background shadow-sm"
                      : "border-transparent bg-background/35 hover:bg-background/70",
                  )}
                >
                  <span className="text-xs font-bold text-muted-foreground">
                    {DAY_LABELS[index]}
                  </span>
                  <span className="mt-1 text-xl font-black">{date.getDate()}</span>
                  {isSameLocalDay(date, today) ? (
                    <span className="mt-1 size-1.5 rounded-full bg-primary" />
                  ) : (
                    <span className="mt-1 size-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <CalorieGaugeWidget
            dateKey={dateKey}
            showCalorieModeToggle
            defaultCalorieMode="eaten"
            onOpen={() => navigate(`/user/nutrition?date=${dateKey}`)}
          />
          <WaterWidget
            dateKey={dateKey}
            onOpen={() => navigate(`/user/water?date=${dateKey}`)}
          />
        </section>

        {!hasLoggedFood ? (
          <Card className="rounded-[1.5rem] border-dashed bg-background/70 p-5">
            <p className="text-sm font-semibold">Bu kunda ovqat log qilinmagan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kunlik kaloriyani ko'rish uchun ovqat qo'shing yoki kamera orqali
              tez kiritishni boshlang.
            </p>
          </Card>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MealsWidget
            dateKey={dateKey}
            onOpen={() => navigate(`/user/nutrition?date=${dateKey}`)}
          />
          <div className="grid grid-cols-1 gap-4">
            <MoodWidget dateKey={dateKey} />
            <WorkoutWidget />
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default DashboardDayContainer;
