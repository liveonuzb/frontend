import React from "react";
import { filter, find, get, map, orderBy, size, values } from "lodash";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  CheckIcon,
  CrownIcon,
  DumbbellIcon,
  FlameIcon,
  MoreVerticalIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  PencilIcon,
  EyeIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import useGetQuery from "@/hooks/api/use-get-query";
import { useLanguageStore, useBreadcrumbStore } from "@/store";
import { cn } from "@/lib/utils";
import CalorieGaugeWidget from "@/modules/user/containers/dashboard/calorie-gauge-widget.jsx";
import {
  DASHBOARD_ME_QUERY_KEY,
  getUserFromResponse,
  normalizeDateKey,
} from "@/modules/user/containers/dashboard/query-helpers.js";
import {
  deriveWorkoutPlanMetrics,
  getFirstWorkoutDayIndex,
  getNextStartableDayIndex,
} from "../utils";

const resolveText = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = String(get(translations, language, "")).trim();
    if (direct) return direct;
    const uzText = String(get(translations, "uz", "")).trim();
    if (uzText) return uzText;
    const enText = String(get(translations, "en", "")).trim();
    if (enText) return enText;
    const ruText = String(get(translations, "ru", "")).trim();
    if (ruText) return ruText;
    const firstValue = find(values(translations), (value) =>
      String(value ?? "").trim(),
    );
    if (firstValue) return String(firstValue).trim();
  }
  return String(fallback ?? "").trim();
};

const PlanSourceBadge = ({ plan }) => {
  const source = get(plan, "source");
  if (source === "ai") {
    return (
      <Badge variant="secondary" className="gap-1">
        <SparklesIcon className="size-3" />
        AI
      </Badge>
    );
  }
  if (get(plan, "isTemplate")) return <Badge variant="outline">Template</Badge>;
  if (source === "coach") return <Badge variant="outline">Murabbiy</Badge>;
  return null;
};

/* ─────────────────────────────────────────────
   Cover image — uses a deterministic gradient
   based on the plan id so each card looks
   distinct without requiring real images.
   ───────────────────────────────────────────── */
const COVER_GRADIENTS = [
  "from-orange-400 via-red-400 to-pink-500",
  "from-emerald-400 via-teal-500 to-cyan-500",
  "from-purple-500 via-fuchsia-500 to-pink-500",
  "from-blue-500 via-indigo-500 to-violet-500",
  "from-amber-400 via-orange-500 to-red-500",
  "from-sky-400 via-blue-500 to-indigo-600",
];

const pickGradient = (key) => {
  const str = String(key ?? "default");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
};

const formatDate = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"][d.getMonth()]}, ${d.getFullYear()}`;
};

const PlanCard = ({
  plan,
  isActive,
  title,
  description,
  onView,
  onStart,
  onEdit,
  onDelete,
  isStartDisabled,
  isEditable,
}) => {
  const dayCount = get(plan, "daysPerWeek") || 0;
  const exerciseCount = get(plan, "totalExercises") || 0;
  const coverImageUrl = get(plan, "coverImageUrl");
  const updatedLabel = formatDate(
    get(plan, "updatedAt") || get(plan, "createdAt"),
  );

  return (
    <div className="group relative flex gap-4 rounded-3xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Cover */}
      <button
        type="button"
        onClick={onView}
        aria-label={`${title} rejani ko'rish`}
        className={cn(
          "relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br shadow-inner transition group-hover:scale-[1.01]",
          !coverImageUrl && pickGradient(get(plan, "id")),
        )}
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DumbbellIcon className="size-10 text-white/85" strokeWidth={2} />
          </div>
        )}
      </button>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold sm:text-base">{title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {isActive ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckIcon className="size-3" />
                  Active
                </Badge>
              ) : null}
              <PlanSourceBadge plan={plan} />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Boshqa amallar"
              >
                <MoreVerticalIcon className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onView}>
                <EyeIcon className="size-4" />
                Ko'rish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onStart} disabled={isStartDisabled}>
                <PlayIcon className="size-4" />
                {isActive ? "Sessiya" : "Boshlash"}
              </DropdownMenuItem>
              {isEditable ? (
                <>
                  <DropdownMenuItem onClick={onEdit}>
                    <PencilIcon className="size-4" />
                    Tahrirlash
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={onDelete}
                  >
                    <Trash2Icon className="size-4" />
                    O'chirish
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <DumbbellIcon className="size-3" />
            {dayCount} kun
          </span>
          <span className="inline-flex items-center gap-1">
            {exerciseCount} mashq
          </span>
        </div>

        {description ? (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}

        <div className="mt-auto pt-2">
          {updatedLabel ? (
            <p className="text-[11px] text-muted-foreground/80">
              {updatedLabel} da yaratildi
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* Right sidebar — calorie gauge, next workout list, custom plan CTA. */
const NextWorkoutItem = ({ name, day, time }) => (
  <div className="flex items-center gap-3 rounded-2xl border bg-card p-2.5 transition hover:bg-muted/40">
    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
      <DumbbellIcon className="size-5 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{name}</p>
      <p className="truncate text-[11px] text-muted-foreground">
        {day} • {time}
      </p>
    </div>
  </div>
);

const Sidebar = ({ activePlan, onCreatePlan, currentLanguage }) => {
  const dateKey = normalizeDateKey(new Date());

  const schedule = get(activePlan, "schedule", []);
  const upcomingDays = filter(
    schedule,
    (entry) => size(get(entry, "exercises", [])) > 0,
  ).slice(0, 3);

  return (
    <div className="space-y-4">
      <CalorieGaugeWidget dateKey={dateKey} />

      {size(upcomingDays) > 0 ? (
        <div className="rounded-3xl border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-bold">Keyingi mashg'ulot</h4>
          <div className="space-y-2">
            {map(upcomingDays, (day, index) => {
              const focus =
                resolveText(
                  get(day, "focusTranslations"),
                  get(day, "focus"),
                  currentLanguage,
                ) || "Mashg'ulot";
              return (
                <NextWorkoutItem
                  key={`${focus}-${index}`}
                  name={focus}
                  day={get(day, "day", `Kun ${index + 1}`)}
                  time={`${size(get(day, "exercises", []))} mashq`}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Custom Plan CTA */}
      <div className="rounded-3xl border bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm">
        <h4 className="text-sm font-bold">Custom Plan yaratish</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          O'zingizga mos mashg'ulot rejasini yarating va natijalaringizni
          oshiring.
        </p>
        <Button onClick={onCreatePlan} className="mt-4 w-full" size="sm">
          <PlusIcon className="size-4" />
          Yangi custom plan
        </Button>
      </div>
    </div>
  );
};

const SORT_OPTIONS = [
  { value: "newest", label: "Eng yangilari" },
  { value: "oldest", label: "Eng eskilari" },
  { value: "name", label: "Alifbo bo'yicha" },
];

const WorkoutPlansPage = () => {
  const navigate = useNavigate();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    plans,
    templates,
    activePlan,
    startPlan,
    removePlan,
    isStartingPlan,
    isRemovingPlan,
  } = useWorkoutPlan();

  // /users/me — for streak badge + premium flag.
  const { data: meData } = useGetQuery({
    url: "/users/me",
    queryProps: { queryKey: DASHBOARD_ME_QUERY_KEY },
  });
  const user = getUserFromResponse(meData);
  const currentStreak = get(user, "currentStreak", 0);
  const isPremium = Boolean(get(user, "premium.isActive"));

  const [tabKey, setTabKey] = React.useState("mine");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortKey, setSortKey] = React.useState("newest");
  const [deletingPlan, setDeletingPlan] = React.useState(null);

  const normalizedPlans = React.useMemo(
    () => map(plans, (plan) => deriveWorkoutPlanMetrics(plan)),
    [plans],
  );

  const normalizedTemplates = React.useMemo(
    () =>
      map(templates, (plan) =>
        deriveWorkoutPlanMetrics({
          ...plan,
          isTemplate: true,
          status: "template",
        }),
      ),
    [templates],
  );

  const filteredAndSorted = React.useMemo(() => {
    const source = tabKey === "saved" ? normalizedTemplates : normalizedPlans;
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = (plan) => {
      if (!term) return true;
      const name = String(get(plan, "name") ?? "").toLowerCase();
      const desc = String(get(plan, "description") ?? "").toLowerCase();
      return name.includes(term) || desc.includes(term);
    };

    const filtered = filter(source, matchesSearch);

    if (sortKey === "name") {
      return orderBy(filtered, [(p) => String(get(p, "name") ?? "")], ["asc"]);
    }

    if (sortKey === "oldest") {
      return orderBy(
        filtered,
        [
          (p) =>
            new Date(
              get(p, "updatedAt") || get(p, "createdAt") || 0,
            ).getTime(),
        ],
        ["asc"],
      );
    }

    // Newest (default): active plan first, then by updated time.
    return orderBy(
      filtered,
      [
        (p) => (get(p, "status") === "active" ? 0 : 1),
        (p) =>
          new Date(get(p, "updatedAt") || get(p, "createdAt") || 0).getTime(),
      ],
      ["asc", "desc"],
    );
  }, [tabKey, normalizedPlans, normalizedTemplates, searchTerm, sortKey]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/plans", title: "Mening rejalarim" },
    ]);
  }, [setBreadcrumbs]);

  const handleStartPlan = async (plan) => {
    try {
      const activatedPlan = await startPlan(plan);
      toast.success(`"${get(plan, "name", "Workout reja")}" boshlandi`);
      if (get(activatedPlan, "id")) {
        const schedule = Array.isArray(get(activatedPlan, "schedule"))
          ? get(activatedPlan, "schedule")
          : [];
        const nextWorkoutDayIndex = getNextStartableDayIndex(activatedPlan);
        const fallbackWorkoutDayIndex = getFirstWorkoutDayIndex(schedule);

        navigate(
          `/user/workout/plans/${get(activatedPlan, "id")}/days/${nextWorkoutDayIndex >= 0 ? nextWorkoutDayIndex : fallbackWorkoutDayIndex >= 0 ? fallbackWorkoutDayIndex : 0}/session`,
        );
      }
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Rejani boshlashda xatolik yuz berdi",
      );
    }
  };

  const handleDeletePlan = async () => {
    if (!get(deletingPlan, "id")) return;
    try {
      await removePlan(get(deletingPlan, "id"));
      toast.success("Workout reja o'chirildi");
      setDeletingPlan(null);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Workout rejani o'chirib bo'lmadi",
      );
    }
  };

  const goToCreate = () => navigate("/user/workout/plans/create");

  return (
    <PageTransition mode="slide-up">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Mening rejalarim
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                O'z rejalarni boshqarish, tahrirlash yoki yangi reja yaratish
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentStreak > 0 ? (
                <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5">
                  <FlameIcon className="size-4 text-orange-500" />
                  <span className="text-sm font-bold tabular-nums text-orange-600">
                    {currentStreak}
                  </span>
                  <span className="text-[11px] font-medium text-orange-600/80">
                    Day streak
                  </span>
                </div>
              ) : null}
              {isPremium ? (
                <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5">
                  <CrownIcon className="size-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">PRO</span>
                </div>
              ) : null}
              <Button onClick={goToCreate}>
                <PlusIcon className="size-4" />
                Yangi plan yaratish
              </Button>
            </div>
          </div>

          {/* Tabs + search + sort */}
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={tabKey} onValueChange={setTabKey}>
              <TabsList>
                <TabsTrigger value="mine">Mening planlarim</TabsTrigger>
                <TabsTrigger value="saved">Saqlangan</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative ml-auto flex-1 sm:max-w-xs">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Reja nomi bo'yicha qidirish..."
                className="pl-9"
              />
            </div>
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {map(SORT_OPTIONS, (option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plan cards grid */}
          {size(filteredAndSorted) > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {map(filteredAndSorted, (plan) => {
                const isTemplate = get(plan, "isTemplate");
                const isActive = get(plan, "id") === get(activePlan, "id");
                const title = isTemplate
                  ? resolveText(
                      get(plan, "translations"),
                      get(plan, "name"),
                      currentLanguage,
                    )
                  : get(plan, "name");
                const description = isTemplate
                  ? resolveText(
                      get(plan, "descriptionTranslations"),
                      get(plan, "description"),
                      currentLanguage,
                    )
                  : get(plan, "description") || "Saqlangan workout reja";

                return (
                  <PlanCard
                    key={`${isTemplate ? "template" : "plan"}-${get(plan, "id")}`}
                    plan={plan}
                    isActive={isActive}
                    title={title}
                    description={description}
                    onView={() =>
                      navigate(`/user/workout/plans/${get(plan, "id")}`)
                    }
                    onStart={() => handleStartPlan(plan)}
                    onEdit={() =>
                      navigate(`/user/workout/plans/edit/${get(plan, "id")}`)
                    }
                    onDelete={() => setDeletingPlan(plan)}
                    isStartDisabled={isStartingPlan}
                    isEditable={
                      !isTemplate && get(plan, "source") !== "coach"
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed bg-muted/20 px-6 py-12 text-center">
              <DumbbellIcon className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {searchTerm
                  ? `"${searchTerm}" bo'yicha reja topilmadi`
                  : tabKey === "saved"
                    ? "Saqlangan template'lar yo'q"
                    : "Hali workout reja yaratmagansiz"}
              </p>
              <Button onClick={goToCreate} className="mt-5">
                <PlusIcon className="size-4" />
                Yangi plan yaratish
              </Button>
            </div>
          )}

          {/* Footer create CTA */}
          {size(filteredAndSorted) > 0 ? (
            <button
              type="button"
              onClick={goToCreate}
              className="flex items-center justify-center gap-2 rounded-3xl border border-dashed bg-muted/10 py-4 text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              <PlusIcon className="size-4" />
              Yangi plan yaratish
            </button>
          ) : null}
        </div>

        {/* Right sidebar */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Sidebar
            activePlan={activePlan}
            onCreatePlan={goToCreate}
            currentLanguage={currentLanguage}
          />
        </aside>
      </div>

      <AlertDialog
        open={Boolean(deletingPlan)}
        onOpenChange={(open) => {
          if (!open) setDeletingPlan(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workout rejani o'chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {get(deletingPlan, "name")
                ? `"${get(deletingPlan, "name")}" rejasi butunlay o'chiriladi.`
                : "Tanlangan workout reja butunlay o'chiriladi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingPlan}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemovingPlan}
              onClick={handleDeletePlan}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default WorkoutPlansPage;
