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
import { useWorkoutCatalog } from "@/hooks/app/use-workout-plans";
import { useBreadcrumbStore } from "@/store";
import { cn } from "@/lib/utils";
import SessionDrawer from "../session-drawer";
import { deriveWorkoutPlanMetrics } from "../utils";

const IMAGE_SET = {
  athlete:
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
  athleteAlt:
    "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=80",
  runner:
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80",
  abs:
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=500&q=80",
  dumbbell:
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=500&q=80",
  pushup:
    "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=500&q=80",
  woman:
    "https://images.unsplash.com/photo-1609899537878-88d5ba429bdb?auto=format&fit=crop&w=500&q=80",
  bench:
    "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=500&q=80",
};

const CHALLENGES = [
  {
    title: "FULL BODY CHALLENGE",
    kicker: "28 KUNLIK",
    description: "4 haftada o'zingizni o'zgartiring",
    image: IMAGE_SET.athlete,
    tone: "primary",
  },
  {
    title: "YOG' YOQISH CHALLENGE",
    kicker: "30 KUNLIK",
    description: "Yog'ni yoqish va formani yaxshilash",
    image: IMAGE_SET.athleteAlt,
    tone: "teal",
  },
  {
    title: "MUSCLE BUILD CHALLENGE",
    kicker: "MUSCLE BUILD",
    description: "Mushaklar o'sishi va kuch oshirish",
    image: IMAGE_SET.dumbbell,
    tone: "blue",
  },
];

const FOCUS_FILTERS = [
  "Abs",
  "Chest",
  "Leg",
  "Arm",
  "Back",
  "Shoulder",
  "Full Body",
];

const FEATURED_WORKOUTS = [
  {
    name: "Abs Beginner",
    focus: "Abs",
    duration: "15 daqiqa",
    exercises: 16,
    difficulty: 2,
    image: IMAGE_SET.abs,
  },
  {
    name: "Abs Intermediate",
    focus: "Abs",
    duration: "24 daqiqa",
    exercises: 21,
    difficulty: 3,
    image: IMAGE_SET.dumbbell,
  },
  {
    name: "Abs Advanced",
    focus: "Abs",
    duration: "27 daqiqa",
    exercises: 21,
    difficulty: 3,
    image: IMAGE_SET.athleteAlt,
  },
  {
    name: "Chest Starter",
    focus: "Chest",
    duration: "20 daqiqa",
    exercises: 14,
    difficulty: 2,
    image: IMAGE_SET.bench,
  },
  {
    name: "Leg Power",
    focus: "Leg",
    duration: "28 daqiqa",
    exercises: 18,
    difficulty: 3,
    image: IMAGE_SET.runner,
  },
  {
    name: "Back Strength",
    focus: "Back",
    duration: "25 daqiqa",
    exercises: 17,
    difficulty: 3,
    image: IMAGE_SET.pushup,
  },
];

const QUICK_FILTERS = [
  { label: "7-15 daqiqa", icon: ClockIcon },
  { label: "< 7 daqiqa", icon: TimerIcon },
  { label: "Beginner", icon: GraduationCapIcon, accent: true },
  { label: "Stretching", icon: SparklesIcon },
  { label: "With Equipment", icon: DumbbellIcon },
  { label: "Keep Fit", icon: HeartIcon },
];

const FALLBACK_PLANS = [
  {
    id: "sample-upper",
    name: "My Upper Body Day",
    daysPerWeek: 4,
    totalExercises: 20,
    createdAt: "2024-05-12",
    image: IMAGE_SET.athlete,
  },
  {
    id: "sample-loss",
    name: "Fat Loss Plan",
    daysPerWeek: 5,
    totalExercises: 24,
    createdAt: "2024-05-09",
    image: IMAGE_SET.woman,
  },
  {
    id: "sample-home",
    name: "Home Workout Plan",
    daysPerWeek: 3,
    totalExercises: 15,
    createdAt: "2024-05-06",
    image: IMAGE_SET.pushup,
  },
  {
    id: "sample-leg",
    name: "Leg Day Power",
    daysPerWeek: 4,
    totalExercises: 18,
    createdAt: "2024-05-02",
    image: IMAGE_SET.dumbbell,
  },
];

const getDateKey = (date = new Date()) => date.toISOString().split("T")[0];

const getWeekDays = () => {
  const labels = ["YAK", "DU", "SE", "CH", "PA", "JU", "SH"];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 2) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      label: labels[date.getDay()],
      day: date.getDate(),
      isToday: getDateKey(date) === getDateKey(today),
      done: index < 2,
    };
  });
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
  const normalized = plans.slice(0, 4).map((plan, index) => ({
    ...plan,
    totalExercises:
      Number(get(plan, "totalExercises")) || countPlanExercises(plan) || 0,
    image: getPlanImage(plan, index),
  }));

  return normalized.length > 0 ? normalized : FALLBACK_PLANS;
};

const buildNextWorkouts = (activePlan) => {
  const schedule = get(activePlan, "schedule", []);
  const planned = schedule
    .filter((day) => get(day, "exercises", []).length > 0)
    .slice(0, 3)
    .map((day, index) => ({
      id: `${get(activePlan, "id", "active")}-${index}`,
      title: get(day, "title") || get(day, "name") || `Day ${index + 1}`,
      time:
        index === 0
          ? "Bugun · 17:00"
          : index === 1
            ? "Ertaga · 17:00"
            : "29 May · 17:00",
      image:
        get(day, "exercises[0].imageUrl") ||
        get(day, "exercises[0].image") ||
        [IMAGE_SET.bench, IMAGE_SET.athleteAlt, IMAGE_SET.dumbbell][index],
    }));

  if (planned.length > 0) {
    return planned;
  }

  return [
    {
      id: "next-chest",
      title: "Chest & Triceps",
      time: "Bugun · 17:00",
      image: IMAGE_SET.bench,
    },
    {
      id: "next-back",
      title: "Back & Biceps",
      time: "Ertaga · 17:00",
      image: IMAGE_SET.athleteAlt,
    },
    {
      id: "next-shoulder",
      title: "Shoulders & Arms",
      time: "29 May · 17:00",
      image: IMAGE_SET.dumbbell,
    },
  ];
};

const buildCatalogWorkouts = (catalog, selectedFocus) => {
  const exercises = Array.isArray(catalog?.exercises) ? catalog.exercises : [];

  return exercises
    .filter((exercise) => {
      const haystack = [
        get(exercise, "name"),
        get(exercise, "bodyPart.name"),
        get(exercise, "muscle.name"),
        get(exercise, "primaryMuscle.name"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (selectedFocus === "Full Body") {
        return true;
      }

      return haystack.includes(selectedFocus.toLowerCase());
    })
    .slice(0, 3)
    .map((exercise, index) => ({
      name: get(exercise, "name") || FEATURED_WORKOUTS[index].name,
      focus: selectedFocus,
      duration: `${15 + index * 5} daqiqa`,
      exercises: 12 + index * 4,
      difficulty: Math.min(4, index + 2),
      image: get(exercise, "imageUrl") || FEATURED_WORKOUTS[index].image,
      sourceExercise: exercise,
    }));
};

function WorkoutHeader() {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-4xl font-black tracking-normal md:text-5xl">
          Workout
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">
          Train. Track. Transform.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="h-11 gap-2 rounded-full px-4 text-base font-bold"
        >
          <FlameIcon className="text-primary" />
          <span>7</span>
          <span className="text-xs font-medium text-muted-foreground">
            Day streak
          </span>
        </Badge>
        <Badge className="h-11 gap-2 rounded-full px-4 text-base font-bold">
          <CrownIcon />
          PRO
        </Badge>
      </div>
    </header>
  );
}

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

function WeeklyGoalCard({ completed, target }) {
  const days = React.useMemo(() => getWeekDays(), []);
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

function ChallengeCard({ challenge }) {
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
          <h3 className="text-2xl font-black leading-tight">{challenge.title}</h3>
          <p className="text-sm font-medium text-white/90">
            {challenge.description}
          </p>
          <Button
            variant="secondary"
            className="mt-auto rounded-full px-8 text-foreground"
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

function ChallengeSection({ onViewAll }) {
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
        {CHALLENGES.map((challenge) => (
          <ChallengeCard key={challenge.title} challenge={challenge} />
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
  catalog,
  selectedFocus,
  onFocusChange,
  search,
  onStart,
}) {
  const catalogRows = React.useMemo(
    () => buildCatalogWorkouts(catalog, selectedFocus),
    [catalog, selectedFocus],
  );
  const fallbackRows = FEATURED_WORKOUTS.filter(
    (workout) =>
      selectedFocus === "Full Body" ||
      workout.focus.toLowerCase() === selectedFocus.toLowerCase(),
  );
  const baseRows = catalogRows.length > 0 ? catalogRows : fallbackRows;
  const rows = baseRows
    .filter((workout) =>
      workout.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .slice(0, 3);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-black">Body Focus</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {FOCUS_FILTERS.map((filter) => (
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
        {cards.map((plan, index) => (
          <PlanCard
            key={get(plan, "id", get(plan, "name"))}
            plan={plan}
            index={index}
            onOpen={() =>
              get(plan, "id", "").startsWith("sample-")
                ? onViewAll()
                : onOpenPlan(plan)
            }
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

function NextWorkoutCard({ items, onOpenPlans, onStart }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyingi mashg'ulot</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border bg-background p-2 text-left transition-colors hover:bg-muted/40"
            onClick={onStart}
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
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onOpenPlans}>
          Barchasini ko'rish
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
  const [selectedFocus, setSelectedFocus] = React.useState("Abs");
  const [sessionDrawerOpen, setSessionDrawerOpen] = React.useState(false);
  const [sessionInitialDayIdx, setSessionInitialDayIdx] = React.useState(0);
  const { overview: workoutOverview } = useWorkoutOverview();
  const { catalog } = useWorkoutCatalog();
  const {
    plans,
    activePlan: rawActivePlan,
    startPlan,
  } = useWorkoutPlan();
  const activePlan = React.useMemo(
    () => deriveWorkoutPlanMetrics(rawActivePlan),
    [rawActivePlan],
  );
  const nextWorkouts = React.useMemo(
    () => buildNextWorkouts(activePlan),
    [activePlan],
  );
  const todayKey = React.useMemo(() => getDateKey(new Date()), []);
  const targetWorkouts =
    Number(get(activePlan, "daysPerWeek")) ||
    Number(get(workoutOverview, "weeklyStats.target")) ||
    4;
  const completedWorkouts = Math.min(
    targetWorkouts,
    Number(get(workoutOverview, "weeklyStats.count")) ||
      Number(get(activePlan, "completedWorkouts")) ||
      2,
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
    ]);
  }, [setBreadcrumbs]);

  const openPlans = React.useCallback(() => {
    navigate("/user/workout/plans");
  }, [navigate]);

  const createPlan = React.useCallback(() => {
    navigate("/user/workout/plans/create");
  }, [navigate]);

  const handleStartSession = React.useCallback(async () => {
    if (!activePlan) {
      navigate("/user/workout/plans/create");
      return;
    }

    try {
      if (get(activePlan, "status") !== "active" && get(activePlan, "id")) {
        await startPlan(activePlan);
      }

      setSessionInitialDayIdx(0);
      setSessionDrawerOpen(true);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Sessiyani boshlashda xatolik yuz berdi",
      );
    }
  }, [activePlan, navigate, startPlan]);

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
        <WorkoutHeader />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <main className="flex min-w-0 flex-col gap-6">
            <SearchBar search={search} onSearchChange={setSearch} />
            <WeeklyGoalCard
              completed={completedWorkouts}
              target={targetWorkouts}
            />
            <ChallengeSection onViewAll={() => navigate("/user/challenges")} />
            <WorkoutExplorer
              catalog={catalog}
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
              onStart={handleStartSession}
            />
            <CustomPlanCard onCreate={createPlan} />
          </aside>
        </div>

        <SessionDrawer
          open={sessionDrawerOpen}
          onOpenChange={setSessionDrawerOpen}
          plan={activePlan}
          initialDayIdx={sessionInitialDayIdx}
          dateKey={todayKey}
        />
      </div>
    </PageTransition>
  );
};

export default WorkoutDashboardPage;
