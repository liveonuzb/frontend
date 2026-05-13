import React from "react";
import { get } from "lodash";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  ClockIcon,
  CrownIcon,
  DumbbellIcon,
  FlameIcon,
  GraduationCapIcon,
  HeartIcon,
  MoreVerticalIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  HistoryIcon,
  TimerIcon,
  ZapIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CalorieGaugeWidget from "@/modules/user/containers/dashboard/calorie-gauge-widget.jsx";
import useWorkoutOverview from "@/hooks/app/use-workout-overview";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import usePremium from "@/hooks/app/use-premium";
import { useWorkoutSessionHistory } from "@/hooks/app/use-workout-sessions";
import {
  useWorkoutCatalog,
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";
import { useBreadcrumbStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  deriveWorkoutPlanMetrics,
  getFirstWorkoutDayIndex,
  getNextStartableDayIndex,
  isWorkoutDayLocked,
} from "../utils";

const IMAGE_SET = {
  athlete:
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
  athleteAlt:
    "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=80",
  runner:
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80",
  abs: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=500&q=80",
  dumbbell:
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=500&q=80",
  pushup:
    "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=500&q=80",
  woman:
    "https://images.unsplash.com/photo-1609899537878-88d5ba429bdb?auto=format&fit=crop&w=500&q=80",
  bench:
    "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=500&q=80",
};

const QUICK_FILTERS = [
  { label: "7-15 daqiqa", icon: ClockIcon },
  { label: "< 7 daqiqa", icon: TimerIcon },
  { label: "Beginner", icon: GraduationCapIcon, accent: true },
  { label: "Stretching", icon: SparklesIcon },
  { label: "With Equipment", icon: DumbbellIcon },
  { label: "Keep Fit", icon: HeartIcon },
];

const getDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split("T")[0];
};

const getWeekDays = (completedDates = []) => {
  const labels = ["YAK", "DU", "SE", "CH", "PA", "JU", "SH"];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 2) % 7));
  const completedDateSet = new Set(completedDates);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      label: labels[date.getDay()],
      day: date.getDate(),
      isToday: getDateKey(date) === getDateKey(today),
      done: completedDateSet.has(getDateKey(date)),
    };
  });
};

const calculateCurrentStreak = (sessions = []) => {
  const uniqueDays = Array.from(
    new Set(
      sessions.map((item) => getDateKey(get(item, "endedAt"))).filter(Boolean),
    ),
  ).sort((a, b) => (a > b ? -1 : 1));

  if (uniqueDays.length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latest = new Date(uniqueDays[0]);
  latest.setHours(0, 0, 0, 0);

  const diffFromToday = Math.round((today - latest) / 86400000);
  if (diffFromToday > 1) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(uniqueDays[index - 1]);
    const current = new Date(uniqueDays[index]);
    previous.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    const diffDays = Math.round((previous - current) / 86400000);
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const formatDate = (value) => {
  if (!value) {
    return "Sana yo'q";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sana yo'q";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const countPlanExercises = (plan) =>
  get(plan, "schedule", []).reduce(
    (total, day) => total + get(day, "exercises", []).length,
    0,
  );

const getPlanImage = (plan, index) =>
  get(plan, "generationMeta.heroImage") ||
  get(plan, "image") ||
  [IMAGE_SET.athlete, IMAGE_SET.woman, IMAGE_SET.pushup, IMAGE_SET.dumbbell][
    index % 4
  ];

const buildPlanCards = (plans = []) => {
  return plans.slice(0, 4).map((plan, index) => ({
    ...plan,
    totalExercises:
      Number(get(plan, "totalExercises")) || countPlanExercises(plan) || 0,
    image: getPlanImage(plan, index),
  }));
};

const toStartOfDay = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatWorkoutRecommendationLabel = (date, now = new Date()) => {
  const targetDate = toStartOfDay(date);
  const today = toStartOfDay(now);

  if (!targetDate || !today) {
    return "Tavsiya etiladi";
  }

  const diffDays = Math.round((targetDate - today) / 86400000);

  if (diffDays === 0) {
    return "Bugun";
  }

  if (diffDays === 1) {
    return "Ertaga";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
  }).format(targetDate);
};

const buildNextWorkouts = (activePlan, now = new Date()) => {
  const schedule = get(activePlan, "schedule", []);
  const nextStartableDayIndex = getNextStartableDayIndex(activePlan);
  const firstWorkoutDayIndex = getFirstWorkoutDayIndex(schedule);
  const startDayIndex =
    nextStartableDayIndex >= 0 ? nextStartableDayIndex : firstWorkoutDayIndex;
  const planStartDate = toStartOfDay(
    get(activePlan, "startDate") || get(activePlan, "createdAt") || now,
  );
  const today = toStartOfDay(now) ?? new Date();
  const initialRecommendedDate =
    planStartDate && startDayIndex >= 0
      ? (() => {
          const candidate = addDays(planStartDate, startDayIndex);
          return candidate > today ? candidate : today;
        })()
      : today;

  const planned = schedule
    .map((day, dayIndex) => ({ day, dayIndex }))
    .filter(
      ({ day, dayIndex }) =>
        dayIndex >= Math.max(0, startDayIndex) &&
        get(day, "exercises", []).length > 0,
    )
    .slice(0, 3)
    .map(({ day, dayIndex }, index) => {
      const recommendedDate = addDays(
        initialRecommendedDate,
        dayIndex - Math.max(0, startDayIndex),
      );

      return {
        id: `${get(activePlan, "id", "active")}-${dayIndex}`,
        dayIndex,
        isStartable: !isWorkoutDayLocked(activePlan, dayIndex),
        title: get(day, "title") || get(day, "name") || `Day ${dayIndex + 1}`,
        time: formatWorkoutRecommendationLabel(recommendedDate, now),
        image:
          get(day, "exercises[0].imageUrl") ||
          get(day, "exercises[0].image") ||
          [IMAGE_SET.bench, IMAGE_SET.athleteAlt, IMAGE_SET.dumbbell][index],
      };
    });

  if (planned.length > 0) {
    return planned;
  }

  return [];
};

const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isFullBodyFilter = (value) =>
  ["full body", "butun tana"].includes(normalizeValue(value));

const getPrimaryBodyFocus = (exercise) =>
  get(exercise, "bodyParts[0]") ||
  get(exercise, "targetMuscles[0]") ||
  get(exercise, "category") ||
  "General";

const formatExerciseDuration = (exercise) => {
  const durationSeconds = Number(get(exercise, "defaultDurationSeconds")) || 0;

  if (durationSeconds > 0) {
    return `${Math.max(1, Math.round(durationSeconds / 60))} daqiqa`;
  }

  const trackingType = normalizeValue(get(exercise, "trackingType"));
  const sets = Number(get(exercise, "defaultSets")) || 0;

  if (trackingType.includes("duration")) {
    return "10-15 daqiqa";
  }

  if (sets > 0) {
    return `${sets} set`;
  }

  return "Tayyor mashq";
};

const getExerciseDifficulty = (exercise) => {
  const trackingType = normalizeValue(get(exercise, "trackingType"));
  const equipmentCount = Array.isArray(get(exercise, "equipments"))
    ? exercise.equipments.length
    : 0;

  if (trackingType === "duration_only" || trackingType === "reps_only") {
    return equipmentCount > 0 ? 2 : 1;
  }

  if (trackingType === "duration_distance") {
    return 2;
  }

  return equipmentCount > 1 ? 4 : 3;
};

const buildFocusFilters = (bodyParts = []) => {
  const names = bodyParts
    .map((item) => get(item, "name"))
    .filter(Boolean)
    .slice(0, 7);

  return names.length > 0 ? names : ["Butun tana"];
};

const buildChallengeCards = (categories = [], exercises = []) =>
  categories.slice(0, 3).map((category, index) => {
    const categoryExercises = exercises.filter((exercise) =>
      Array.isArray(get(exercise, "categoryIds"))
        ? exercise.categoryIds.includes(category.id)
        : get(exercise, "categoryId") === category.id,
    );
    const leadExercise = categoryExercises[0];

    return {
      id: category.id,
      title: get(category, "name", "Workout"),
      kicker: `${categoryExercises.length || 0} mashq`,
      description:
        categoryExercises.length > 0
          ? categoryExercises
              .slice(0, 3)
              .map((exercise) => get(exercise, "name"))
              .filter(Boolean)
              .join(" • ")
          : "Hozircha mashqlar mavjud emas",
      image:
        get(leadExercise, "imageUrl") ||
        [IMAGE_SET.athlete, IMAGE_SET.athleteAlt, IMAGE_SET.dumbbell][
          index % 3
        ],
      tone: index % 3 === 1 ? "teal" : index % 3 === 2 ? "blue" : "primary",
      categoryId: category.id,
    };
  });

const buildCatalogWorkouts = (
  exercises = [],
  selectedFocus,
  selectedCategoryId,
) => {
  return exercises
    .filter((exercise) => {
      if (
        selectedCategoryId &&
        !(
          (Array.isArray(get(exercise, "categoryIds")) &&
            exercise.categoryIds.includes(selectedCategoryId)) ||
          get(exercise, "categoryId") === selectedCategoryId
        )
      ) {
        return false;
      }

      if (isFullBodyFilter(selectedFocus)) {
        return true;
      }

      const haystack = [
        get(exercise, "name"),
        ...(Array.isArray(get(exercise, "bodyParts"))
          ? exercise.bodyParts
          : []),
        ...(Array.isArray(get(exercise, "targetMuscles"))
          ? exercise.targetMuscles
          : []),
        ...(Array.isArray(get(exercise, "equipments"))
          ? exercise.equipments
          : []),
        get(exercise, "category"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizeValue(selectedFocus));
    })
    .slice(0, 3)
    .map((exercise) => ({
      name: get(exercise, "name") || "Workout",
      focus: getPrimaryBodyFocus(exercise),
      duration: formatExerciseDuration(exercise),
      exercises: 1,
      difficulty: getExerciseDifficulty(exercise),
      image: get(exercise, "imageUrl") || IMAGE_SET.athlete,
      sourceExercise: exercise,
    }));
};

function SearchBar({ search, onSearchChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Workout, plan yoki mashg'ulot qidirish..."
          className="h-14 rounded-full pl-12 text-base"
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        className="size-14 rounded-full"
        aria-label="Workout filterlari"
      >
        <Settings2Icon />
      </Button>
    </div>
  );
}

function WeeklyGoalCard({ completed, target, completedDates }) {
  const days = React.useMemo(
    () => getWeekDays(completedDates),
    [completedDates],
  );
  const progress =
    target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Haftalik maqsad</CardTitle>
        </div>
        <CardAction>
          <Button variant="ghost" className="rounded-full">
            {completed}/{target} mashg'ulot
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[1fr_auto] items-center gap-5">
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <div key={`${day.label}-${day.day}`} className="text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  {day.label}
                </p>
                <p className="mt-1 text-sm font-bold">{day.day}</p>
                <div
                  className={cn(
                    "mx-auto mt-3 flex size-7 items-center justify-center rounded-full border text-xs font-black",
                    day.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : day.isToday
                        ? "border-primary text-primary"
                        : "border-border text-transparent",
                  )}
                >
                  {day.done ? "✓" : "•"}
                </div>
              </div>
            ))}
          </div>
          <div
            className="grid size-20 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-primary) ${progress * 3.6}deg, var(--color-muted) 0deg)`,
            }}
          >
            <div className="grid size-14 place-items-center rounded-full bg-background text-sm font-black">
              {progress}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChallengeCard({ challenge, onStart }) {
  const toneClass =
    challenge.tone === "teal"
      ? "from-teal-500 to-emerald-700"
      : challenge.tone === "blue"
        ? "from-blue-900 to-sky-800"
        : "from-amber-500 to-orange-600";

  return (
    <Card className="min-h-56 min-w-72 overflow-hidden border-0 p-0 text-white shadow-sm md:min-w-0">
      <div className={cn("relative h-full bg-gradient-to-br p-6", toneClass)}>
        <div className="relative z-10 flex h-full max-w-[58%] flex-col items-start gap-3">
          <p className="text-sm font-bold uppercase tracking-normal text-white/85">
            {challenge.kicker}
          </p>
          <h3 className="text-2xl font-black leading-tight">
            {challenge.title}
          </h3>
          <p className="text-sm font-medium text-white/90">
            {challenge.description}
          </p>
          <Button
            variant="secondary"
            className="mt-auto rounded-full px-8 text-foreground"
            onClick={() => onStart(challenge)}
          >
            Boshlash
          </Button>
        </div>
        <img
          src={challenge.image}
          alt={challenge.title}
          className="absolute bottom-0 right-0 h-full w-[52%] object-cover opacity-95 mix-blend-luminosity"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/20" />
      </div>
    </Card>
  );
}

function ChallengeSection({ challenges, onViewAll, onStartChallenge }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black">Challenge</h2>
        <Button variant="ghost" className="rounded-full" onClick={onViewAll}>
          Barchasini ko'rish
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onStart={onStartChallenge}
          />
        ))}
      </div>
    </section>
  );
}

function DifficultyBolts({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 4 }, (_, index) => (
        <ZapIcon
          key={index}
          className={cn(
            "size-4",
            index < value ? "fill-blue-500 text-blue-500" : "text-muted",
          )}
        />
      ))}
    </div>
  );
}

function WorkoutExplorer({
  exercises,
  bodyParts,
  selectedCategoryId,
  selectedFocus,
  onFocusChange,
  search,
  onStart,
}) {
  const catalogRows = React.useMemo(
    () => buildCatalogWorkouts(exercises, selectedFocus, selectedCategoryId),
    [exercises, selectedCategoryId, selectedFocus],
  );
  const rows = catalogRows
    .filter((workout) =>
      workout.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .slice(0, 3);
  const focusFilters = React.useMemo(
    () => buildFocusFilters(bodyParts),
    [bodyParts],
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-black">Body Focus</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {focusFilters.map((filter) => (
          <Button
            key={filter}
            variant={selectedFocus === filter ? "outline" : "secondary"}
            className={cn(
              "h-10 min-w-24 rounded-full",
              selectedFocus === filter
                ? "border-primary text-primary"
                : "text-muted-foreground",
            )}
            onClick={() => onFocusChange(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Hozircha mos mashqlar topilmadi.
            </div>
          ) : null}
          {rows.map((workout, index) => (
            <div
              key={`${workout.name}-${index}`}
              className="grid grid-cols-[112px_1fr_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0 md:grid-cols-[140px_1fr_auto]"
            >
              <img
                src={workout.image}
                alt={workout.name}
                className="h-20 w-full rounded-2xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black">{workout.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {workout.duration} <span className="mx-2">•</span>
                  {workout.exercises} mashq
                </p>
                <div className="mt-2">
                  <DifficultyBolts value={workout.difficulty} />
                </div>
              </div>
              <Button
                variant="secondary"
                className="hidden rounded-2xl px-8 text-primary sm:inline-flex"
                onClick={() => onStart(workout)}
              >
                Boshlash
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full text-primary sm:hidden"
                aria-label={`${workout.name} boshlash`}
                onClick={() => onStart(workout)}
              >
                <PlayIcon />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {rows.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {QUICK_FILTERS.map((item) => {
            const Icon = item.icon;

            return (
              <Button
                key={item.label}
                variant="outline"
                className="h-12 justify-center rounded-2xl font-semibold"
              >
                <Icon
                  data-icon="inline-start"
                  className={item.accent ? "text-blue-500" : undefined}
                />
                {item.label}
              </Button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function PlanSourceBadge({ plan }) {
  const source = get(plan, "source");

  if (source === "ai") {
    return (
      <Badge variant="secondary">
        <SparklesIcon />
        AI
      </Badge>
    );
  }

  if (source === "coach") {
    return <Badge variant="outline">Coach</Badge>;
  }

  return null;
}

function PlanCard({ plan, index, onOpen }) {
  return (
    <Card
      className="min-w-64 cursor-pointer p-3 transition-transform hover:-translate-y-0.5"
      onClick={onOpen}
    >
      <div className="flex gap-3">
        <img
          src={getPlanImage(plan, index)}
          alt={get(plan, "name", "Workout plan")}
          className="size-20 rounded-2xl object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-black">
              {get(plan, "name", "Workout plan")}
            </h3>
            <MoreVerticalIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {get(plan, "daysPerWeek", 0)} kun
            <span className="mx-1.5">•</span>
            {get(plan, "totalExercises") || countPlanExercises(plan)} mashq
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {formatDate(get(plan, "createdAt"))}
            </p>
            <PlanSourceBadge plan={plan} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlansStrip({ plans, onViewAll, onCreate, onOpenPlan }) {
  const cards = React.useMemo(() => buildPlanCards(plans), [plans]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black">Mening rejalarim</h2>
        <Button variant="ghost" className="rounded-full" onClick={onViewAll}>
          Barchasini ko'rish
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {cards.length === 0 ? (
          <Card className="grid min-w-72 place-items-center border-dashed p-6 text-center">
            <div>
              <p className="text-sm font-semibold">Hozircha reja yo‘q</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Birinchi workout rejangizni yarating yoki AI bilan boshlang.
              </p>
            </div>
          </Card>
        ) : null}
        {cards.map((plan, index) => (
          <PlanCard
            key={get(plan, "id", get(plan, "name"))}
            plan={plan}
            index={index}
            onOpen={() => onOpenPlan(plan)}
          />
        ))}
        <Card
          className="grid min-w-32 cursor-pointer place-items-center border-dashed p-4 text-center"
          onClick={onCreate}
        >
          <PlusIcon className="size-8 text-foreground" />
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Yangi plan yaratish
          </p>
        </Card>
      </div>
    </section>
  );
}

function NextWorkoutCard({ items, onOpenPlans, onOpenHistory, onStart }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyingi mashg'ulot</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Faol plan yo‘q. Reja yaratganingizdan keyin keyingi mashg‘ulot shu
            yerda ko‘rinadi.
          </div>
        ) : null}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border bg-background p-2 text-left transition-colors hover:bg-muted/40"
            onClick={() => onStart(item)}
          >
            <img
              src={item.image}
              alt={item.title}
              className="size-16 rounded-xl object-cover"
              loading="lazy"
            />
            <span className="min-w-0">
              <span className="block truncate font-bold">{item.title}</span>
              <span className="mt-1 block truncate text-sm text-muted-foreground">
                {item.time}
              </span>
            </span>
            <ArrowRightIcon className="size-5 text-muted-foreground" />
          </button>
        ))}
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="w-full" onClick={onOpenPlans}>
          Barchasini ko'rish
        </Button>
        <Button variant="secondary" className="w-full" onClick={onOpenHistory}>
          <HistoryIcon data-icon="inline-start" />
          Tarix
        </Button>
      </CardFooter>
    </Card>
  );
}

function CustomPlanCard({ onCreate }) {
  return (
    <Card className="overflow-hidden bg-primary/5">
      <CardContent className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center xl:grid-cols-1">
        <div>
          <h2 className="text-2xl font-black">Custom Plan yaratish</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            O'zingizga mos mashg'ulot rejasini yarating va natijalaringizni
            oshiring.
          </p>
          <Button variant="outline" className="mt-5" onClick={onCreate}>
            <PlusIcon data-icon="inline-start" />
            Yangi custom plan
          </Button>
        </div>
        <div className="hidden size-28 place-items-center rounded-[2rem] bg-background shadow-sm sm:grid xl:mx-auto xl:size-36">
          <DumbbellIcon className="size-16 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

const WorkoutDashboardPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [search, setSearch] = React.useState("");
  const [selectedFocus, setSelectedFocus] = React.useState("Butun tana");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(null);
  const { overview: workoutOverview } = useWorkoutOverview();
  const { sessions: sessionHistory } = useWorkoutSessionHistory();
  const { catalog } = useWorkoutCatalog();
  const { categories } = useWorkoutExerciseCategories();
  const { exercises } = useWorkoutExercises();
  const { plans, activePlan: rawActivePlan, startPlan } = useWorkoutPlan();
  const activePlan = React.useMemo(
    () => deriveWorkoutPlanMetrics(rawActivePlan),
    [rawActivePlan],
  );
  const nextWorkouts = React.useMemo(
    () => buildNextWorkouts(activePlan),
    [activePlan],
  );
  const challenges = React.useMemo(
    () => buildChallengeCards(categories, exercises),
    [categories, exercises],
  );
  const todayKey = React.useMemo(() => getDateKey(new Date()), []);

  const completedDates = React.useMemo(
    () =>
      Array.isArray(get(workoutOverview, "recentWorkoutDays"))
        ? workoutOverview.recentWorkoutDays
            .map((item) => item?.date)
            .filter(Boolean)
        : [],
    [workoutOverview],
  );

  const targetWorkouts =
    Number(get(activePlan, "daysPerWeek")) ||
    Number(get(workoutOverview, "weeklyStats.target")) ||
    4;
  const completedWorkouts = Math.min(
    targetWorkouts,
    Number(get(workoutOverview, "weeklyStats.count")) ||
      Number(get(activePlan, "completedWorkouts")) ||
      0,
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
    ]);
  }, [setBreadcrumbs]);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const focusFilters = buildFocusFilters(get(catalog, "bodyParts", []));

    if (
      focusFilters.length > 0 &&
      !focusFilters.some((item) => item === selectedFocus)
    ) {
      setSelectedFocus(focusFilters[0]);
    }
  }, [catalog, selectedFocus]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openPlans = React.useCallback(() => {
    navigate("/user/workout/plans");
  }, [navigate]);

  const openHistory = React.useCallback(() => {
    navigate("/user/workout/history");
  }, [navigate]);

  const createPlan = React.useCallback(() => {
    navigate("/user/workout/plans/create");
  }, [navigate]);

  const handleChallengeStart = React.useCallback((challenge) => {
    setSelectedCategoryId(get(challenge, "categoryId") ?? null);
    toast.info(
      `${get(challenge, "title", "Workout")} bo'yicha mashqlar filtrlab ko'rsatildi.`,
    );
  }, []);

  const handleStartSession = React.useCallback(
    async (targetWorkout = null) => {
      if (!activePlan) {
        navigate("/user/workout/plans/create");
        return;
      }

      try {
        if (get(activePlan, "status") !== "active" && get(activePlan, "id")) {
          await startPlan(activePlan);
        }

        const nextWorkoutDayIndex =
          Number.isInteger(get(targetWorkout, "dayIndex")) &&
          get(targetWorkout, "dayIndex") >= 0
            ? get(targetWorkout, "dayIndex")
            : getNextStartableDayIndex(activePlan);
        const fallbackWorkoutDayIndex = getFirstWorkoutDayIndex(
          get(activePlan, "schedule", []),
        );
        const resolvedDayIndex =
          nextWorkoutDayIndex >= 0
            ? nextWorkoutDayIndex
            : fallbackWorkoutDayIndex >= 0
              ? fallbackWorkoutDayIndex
              : 0;

        if (
          Number.isInteger(get(targetWorkout, "dayIndex")) &&
          isWorkoutDayLocked(activePlan, resolvedDayIndex)
        ) {
          navigate(
            `/user/workout/plans/${get(activePlan, "id")}/days/${resolvedDayIndex}`,
          );
          return;
        }

        navigate(
          `/user/workout/plans/${get(activePlan, "id")}/days/${resolvedDayIndex}/session`,
        );
      } catch (error) {
        toast.error(
          get(error, "response.data.message") ||
            "Sessiyani boshlashda xatolik yuz berdi",
        );
      }
    },
    [activePlan, navigate, startPlan],
  );

  const handleStartWorkout = React.useCallback(
    (workout) => {
      navigate("/user/workout/logs/create", {
        state: {
          initialExercise: get(workout, "sourceExercise") || {
            name: get(workout, "name"),
          },
        },
      });
    },
    [navigate],
  );

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 pb-4">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <main className="flex min-w-0 flex-col gap-6">
            <SearchBar search={search} onSearchChange={setSearch} />
            <WeeklyGoalCard
              completed={completedWorkouts}
              target={targetWorkouts}
              completedDates={completedDates}
            />
            <ChallengeSection
              challenges={challenges}
              onViewAll={openPlans}
              onStartChallenge={handleChallengeStart}
            />
            <WorkoutExplorer
              exercises={exercises}
              bodyParts={get(catalog, "bodyParts", [])}
              selectedCategoryId={selectedCategoryId}
              search={search}
              selectedFocus={selectedFocus}
              onFocusChange={setSelectedFocus}
              onStart={handleStartWorkout}
            />
            <PlansStrip
              plans={plans}
              onViewAll={openPlans}
              onCreate={createPlan}
              onOpenPlan={(plan) => navigate(`/user/workout/plans/${plan.id}`)}
            />
          </main>

          <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
            <CalorieGaugeWidget
              dateKey={todayKey}
              showCalorieModeToggle
              defaultCalorieMode="remaining"
            />
            <NextWorkoutCard
              items={nextWorkouts}
              onOpenPlans={openPlans}
              onOpenHistory={openHistory}
              onStart={handleStartSession}
            />
            <CustomPlanCard onCreate={createPlan} />
          </aside>
        </div>
      </div>
    </PageTransition>
  );
};

export default WorkoutDashboardPage;
