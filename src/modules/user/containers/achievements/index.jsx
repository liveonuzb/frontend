import React from "react";
import {
  clamp,
  filter,
  get,
  isArray,
  map,
  orderBy,
  replace,
  round,
  size,
  toNumber,
  toUpper,
  trim,
} from "lodash";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  FlameIcon,
  HistoryIcon,
  LockIcon,
  MedalIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";

import PageTransition from "@/components/page-transition";
import PageLoader from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import { XpHistoryContent } from "@/modules/user/containers/xp-history";
import {
  GAMIFICATION_ACHIEVEMENT_CATEGORIES_QUERY_KEY,
  GAMIFICATION_ACHIEVEMENT_DETAIL_QUERY_KEY,
  GAMIFICATION_ACHIEVEMENT_SUMMARY_QUERY_KEY,
  GAMIFICATION_ACHIEVEMENTS_QUERY_KEY,
} from "@/modules/user/lib/gamification-query-keys";
import { useAppModeStore, useBreadcrumbStore } from "@/store";

const EMPTY_ARRAY = [];

const CATEGORY_LABELS = {
  NUTRITION: "Ovqatlanish",
  WORKOUT: "Mashg'ulot",
  WATER: "Suv",
  SOCIAL: "Ijtimoiy",
  STREAK: "Streak",
  CHALLENGE: "Challenge",
  GENERAL: "Umumiy",
};

const CATEGORY_BADGES = {
  NUTRITION: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  WORKOUT: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  WATER: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  SOCIAL: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
  STREAK: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  CHALLENGE: "bg-lime-500/10 text-lime-700 border-lime-500/20",
  GENERAL: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const RING_COLORS = {
  achievements: "#f59e0b",
  xp: "#0ea5e9",
  streak: "#f43f5e",
};

const getCategoryLabel = (category) => {
  const normalized = toUpper(trim(String(category ?? "")));
  return CATEGORY_LABELS[normalized] ?? trim(replace(normalized, /_/g, " "));
};

const getCategoryBadgeClassName = (category) => {
  const normalized = toUpper(trim(String(category ?? "")));
  return CATEGORY_BADGES[normalized] ?? CATEGORY_BADGES.GENERAL;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(toNumber(value) || 0);

const formatCompactNumber = (value) => {
  const numericValue = toNumber(value) || 0;

  if (Math.abs(numericValue) < 1000) {
    return formatNumber(numericValue);
  }

  return replace(
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(numericValue),
    ".0",
    "",
  );
};

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const toPercent = (value) => clamp(round(toNumber(value) || 0), 0, 100);

const getAchievementProgressPercent = (item) => {
  const threshold = toNumber(get(item, "threshold")) || 0;

  if (threshold <= 0) {
    return 0;
  }

  return toPercent(((toNumber(get(item, "progress")) || 0) / threshold) * 100);
};

const getAchievementImage = (item, mode = "madagascar") => {
  const modeField =
    mode === "zen"
      ? "imageZenUrl"
      : mode === "focus"
        ? "imageFocusUrl"
        : "imageMadagascarUrl";

  return (
    get(item, modeField) ||
    get(item, "imageUrl") ||
    get(item, "imageMadagascarUrl") ||
    get(item, "imageZenUrl") ||
    get(item, "imageFocusUrl") ||
    ""
  );
};

const buildSummaryFallback = (achievements) => {
  const unlockedAchievements = filter(achievements, { unlocked: true });
  const unlocked = size(unlockedAchievements);
  const total = size(achievements);
  const nextAwards = orderBy(
    filter(achievements, (item) => !get(item, "unlocked")),
    [(item) => getAchievementProgressPercent(item), (item) => toNumber(get(item, "threshold")) || 0],
    ["desc", "asc"],
  );

  return {
    rings: {
      achievements: {
        unlocked,
        total,
        percent: total > 0 ? toPercent((unlocked / total) * 100) : 0,
      },
      xp: {
        xp: 0,
        level: 1,
        levelProgress: 0,
      },
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        trackedDays: 0,
        nextMilestone: 0,
        percent: 0,
      },
    },
    nextAwards,
  };
};

const AchievementImage = ({ item, mode, className }) => {
  const imageUrl = getAchievementImage(item, mode);
  const isUnlocked = Boolean(get(item, "unlocked"));

  return (
    <div
      className={cn(
        "relative flex size-16 shrink-0 items-center justify-center rounded-full border bg-card shadow-sm",
        isUnlocked
          ? "border-amber-400/50 shadow-amber-500/10"
          : "border-border/80 bg-muted/50",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-[82%] items-center justify-center overflow-hidden rounded-full border bg-background",
          isUnlocked ? "border-amber-300/50" : "border-border/70 grayscale",
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={get(item, "name") || "Achievement rasmi"}
            className={cn(
              "size-full object-cover",
              isUnlocked ? "" : "opacity-55",
            )}
          />
        ) : (
          <TrophyIcon
            className={cn(
              "size-7",
              isUnlocked ? "text-amber-500" : "text-muted-foreground/50",
            )}
          />
        )}
      </div>
      {isUnlocked ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <CheckCircle2Icon className="size-3.5" />
        </span>
      ) : (
        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full border bg-background text-muted-foreground">
          <LockIcon className="size-3" />
        </span>
      )}
    </div>
  );
};

const SummaryRingCard = ({
  ariaValue,
  color,
  helper,
  icon: Icon,
  label,
  percent,
  title,
  value,
}) => {
  const ringPercent = toPercent(percent);

  return (
    <Card
      className="rounded-2xl border-border/70 bg-card/90 py-0 shadow-none"
      aria-label={`${label} ring ${ariaValue}`}
    >
      <CardContent className="flex items-center gap-3 p-3 sm:p-4">
        <div
          className="relative flex size-16 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${color} ${
              ringPercent * 3.6
            }deg, hsl(var(--muted)) 0deg)`,
          }}
        >
          <div className="absolute inset-1.5 rounded-full bg-background" />
          <div
            className="absolute inset-3 rounded-full border"
            style={{ borderColor: color }}
          />
          <Icon className="relative z-10 size-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="mt-0.5 truncate text-2xl font-black leading-none">
            {value}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
            {helper}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const NextAwardRow = ({ item, mode, onOpen }) => {
  const progressPercent = getAchievementProgressPercent(item);
  const remaining = Math.max(
    0,
    (toNumber(get(item, "threshold")) || 0) - (toNumber(get(item, "progress")) || 0),
  );

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-2.5 text-left transition hover:border-amber-400/50 hover:bg-amber-500/5"
      aria-label={`${get(item, "name")} keyingi yutuq`}
    >
      <AchievementImage item={item} mode={mode} className="size-11" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">
          Keyingi: {get(item, "name")}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1 bg-muted" />
          <span className="text-xs font-bold text-muted-foreground">
            {progressPercent}%
          </span>
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs font-semibold text-muted-foreground">Qoldi</p>
        <p className="text-sm font-black">{formatCompactNumber(remaining)}</p>
      </div>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
};

const AchievementCard = ({ item, mode, onOpen }) => {
  const isUnlocked = Boolean(get(item, "unlocked"));
  const progressPercent = getAchievementProgressPercent(item);
  const category = get(item, "category");

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "group flex min-h-[15rem] w-full flex-col rounded-2xl border bg-card text-left shadow-none transition motion-safe:hover:-translate-y-0.5 hover:shadow-md",
        isUnlocked
          ? "border-amber-400/40"
          : "border-border/70 hover:border-muted-foreground/40",
      )}
      aria-label={`${get(item, "name")} achievement`}
    >
      <div
        className={cn(
          "flex flex-1 flex-col items-center gap-3 px-4 pb-4 pt-5",
          isUnlocked ? "bg-amber-500/[0.04]" : "bg-muted/[0.18]",
        )}
      >
        <AchievementImage item={item} mode={mode} className="size-20" />

        <div className="w-full min-w-0 text-center">
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={cn(
                "max-w-full rounded-full border text-[10px] font-black uppercase tracking-wide",
                getCategoryBadgeClassName(category),
              )}
            >
              {getCategoryLabel(category)}
            </Badge>
          </div>
          <p className="mt-2 truncate text-base font-black">
            {get(item, "name")}
          </p>
          <p className="mt-1 line-clamp-2 min-h-9 text-xs font-medium text-muted-foreground">
            {get(item, "description")}
          </p>
        </div>

        <div className="mt-auto w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-muted-foreground">Progress</span>
            <span>
              {formatCompactNumber(get(item, "progress"))}/
              {formatCompactNumber(get(item, "threshold"))}
            </span>
          </div>
          <Progress
            value={isUnlocked ? 100 : progressPercent}
            className={cn(
              "h-2 bg-muted",
              isUnlocked ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary",
            )}
          />
          <div className="flex items-center justify-between gap-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 font-black",
                isUnlocked ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {isUnlocked ? (
                <CheckCircle2Icon className="size-3.5" />
              ) : (
                <LockIcon className="size-3.5" />
              )}
              {isUnlocked ? "Ochilgan" : "Jarayonda"}
            </span>
            <span className="inline-flex items-center gap-1 font-black text-amber-600">
              <ZapIcon className="size-3.5" />+
              {formatCompactNumber(get(item, "xpReward"))} XP
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

const AchievementsEmptyState = () => (
  <Card className="rounded-2xl border-dashed shadow-none">
    <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
      <StarIcon className="size-10 text-muted-foreground/30" />
      <p className="font-black">Yutuqlar topilmadi</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Bu kategoriyada hali yutuqlar yo'q. Boshqa kategoriya tanlab ko'ring.
      </p>
    </CardContent>
  </Card>
);

const AchievementsPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentMode = useAppModeStore((state) => state.mode) || "madagascar";
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [selectedAchievementId, setSelectedAchievementId] = React.useState(null);
  const [selectedFallbackItem, setSelectedFallbackItem] = React.useState(null);
  const [xpDrawerOpen, setXpDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Dashboard" },
      { url: "/user/achievements", title: "Yutuqlar" },
    ]);
  }, [setBreadcrumbs]);

  const { data: summaryData, isLoading: isSummaryLoading } = useGetQuery({
    url: "/user/gamification/achievements/summary",
    params: { mode: currentMode },
    queryProps: {
      queryKey: [
        ...GAMIFICATION_ACHIEVEMENT_SUMMARY_QUERY_KEY,
        currentMode,
      ],
    },
  });

  const { data: categoriesData } = useGetQuery({
    url: "/user/gamification/achievements/categories",
    queryProps: {
      queryKey: GAMIFICATION_ACHIEVEMENT_CATEGORIES_QUERY_KEY,
    },
  });

  const { data: achievementsData, isLoading: isAchievementsLoading } =
    useGetQuery({
      url: "/user/gamification/achievements",
      params: {
        mode: currentMode,
        ...(selectedCategory ? { category: selectedCategory } : {}),
      },
      queryProps: {
        queryKey: [
          ...GAMIFICATION_ACHIEVEMENTS_QUERY_KEY,
          selectedCategory ?? "all",
          currentMode,
        ],
      },
    });

  const detailUrl = selectedAchievementId
    ? `/user/gamification/achievements/${selectedAchievementId}`
    : "/user/gamification/achievements/0";
  const {
    data: detailData,
    isFetching: isDetailFetching,
    isError: isDetailError,
  } = useGetQuery({
    url: detailUrl,
    params: { mode: currentMode },
    queryProps: {
      queryKey: [
        ...GAMIFICATION_ACHIEVEMENT_DETAIL_QUERY_KEY,
        selectedAchievementId,
        currentMode,
      ],
      enabled: Boolean(selectedAchievementId),
    },
  });

  const rawCategories = getApiResponseData(categoriesData, EMPTY_ARRAY);
  const categories = isArray(rawCategories) ? rawCategories : EMPTY_ARRAY;
  const rawAchievements = getApiResponseData(achievementsData, EMPTY_ARRAY);
  const achievements = isArray(rawAchievements) ? rawAchievements : EMPTY_ARRAY;
  const fallbackSummary = React.useMemo(
    () => buildSummaryFallback(achievements),
    [achievements],
  );
  const summary =
    getApiResponseData(summaryData, null) ??
    fallbackSummary;
  const rings = get(summary, "rings", get(fallbackSummary, "rings"));
  const nextAwards = isArray(get(summary, "nextAwards"))
    ? get(summary, "nextAwards")
    : get(fallbackSummary, "nextAwards", EMPTY_ARRAY);
  const unlockedCount = toNumber(get(rings, "achievements.unlocked")) || 0;
  const totalCount = toNumber(get(rings, "achievements.total")) || size(achievements);
  const detailItem =
    selectedAchievementId &&
    !isDetailError &&
    getApiResponseData(detailData, null)
      ? getApiResponseData(detailData, null)
      : selectedFallbackItem;

  const openAchievement = React.useCallback((item) => {
    setSelectedFallbackItem(item);
    setSelectedAchievementId(get(item, "id"));
  }, []);

  const closeAchievement = React.useCallback(() => {
    setSelectedAchievementId(null);
    setSelectedFallbackItem(null);
  }, []);

  if (
    (isSummaryLoading || isAchievementsLoading) &&
    size(achievements) === 0 &&
    !getApiResponseData(summaryData, null)
  ) {
    return <PageLoader />;
  }

  return (
    <PageTransition mode="slide-up">
      <div className="flex w-full flex-col gap-5 pb-24">
        <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="rounded-2xl border-border/70 bg-card py-0 shadow-none">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-black text-muted-foreground">
                    <SparklesIcon className="size-3.5 text-amber-500" />
                    Apple Fitness ruhida
                  </div>
                  <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                    Yutuqlar
                  </h1>
                  <p className="mt-1 max-w-xl text-sm font-medium text-muted-foreground">
                    XP, streak va odatlar bo'yicha ochiladigan medal va kuboklar.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl border bg-background px-3 py-2">
                    <p className="text-lg font-black">{formatNumber(unlockedCount)}</p>
                    <p className="text-[11px] font-bold text-muted-foreground">
                      Ochilgan
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-background px-3 py-2">
                    <p className="text-lg font-black">{formatNumber(totalCount)}</p>
                    <p className="text-[11px] font-bold text-muted-foreground">
                      Jami
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-background px-3 py-2">
                    <p className="text-lg font-black">
                      {toPercent(get(rings, "achievements.percent"))}%
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground">
                      Progress
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card py-0 shadow-none">
            <CardContent className="flex h-full items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                  Keyingi maqsad
                </p>
                <p className="mt-1 text-lg font-black">
                  {size(nextAwards) > 0
                    ? `Keyingi: ${get(nextAwards, "0.name")}`
                    : "Hammasi ochilgan"}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {size(nextAwards) > 0
                    ? `+${formatCompactNumber(get(nextAwards, "0.xpReward"))} XP mukofot`
                    : "Yangi yutuqlar tez orada qo'shiladi."}
                </p>
              </div>
              <MedalIcon className="size-10 text-amber-500" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <SummaryRingCard
            ariaValue={`${toPercent(get(rings, "achievements.percent"))}%`}
            color={RING_COLORS.achievements}
            helper={`${formatNumber(get(rings, "achievements.unlocked"))}/${formatNumber(
              get(rings, "achievements.total"),
            )} medal`}
            icon={TrophyIcon}
            label="Achievements"
            percent={get(rings, "achievements.percent")}
            title="Achievements"
            value={`${toPercent(get(rings, "achievements.percent"))}%`}
          />
          <SummaryRingCard
            ariaValue={`Level ${toNumber(get(rings, "xp.level")) || 1}`}
            color={RING_COLORS.xp}
            helper={`${formatCompactNumber(get(rings, "xp.xp"))} XP`}
            icon={ZapIcon}
            label="XP"
            percent={get(rings, "xp.levelProgress")}
            title="XP"
            value={`L${toNumber(get(rings, "xp.level")) || 1}`}
          />
          <SummaryRingCard
            ariaValue={`${toNumber(get(rings, "streak.currentStreak")) || 0} kun`}
            color={RING_COLORS.streak}
            helper={`Eng uzun: ${formatNumber(get(rings, "streak.longestStreak"))} kun`}
            icon={FlameIcon}
            label="Streak"
            percent={get(rings, "streak.percent")}
            title="Streak"
            value={`${formatNumber(get(rings, "streak.currentStreak"))}`}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="flex min-w-0 flex-col gap-5">
            <Card className="rounded-2xl border-border/70 py-0 shadow-none">
              <CardHeader className="px-4 pt-4 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-black">
                      Keyingi yutuqlar
                    </CardTitle>
                    <CardDescription>
                      Progress eng yaqin bo'lgan mukofotlar.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {formatNumber(size(nextAwards))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 px-4 pb-4 sm:px-5 md:grid-cols-2">
                {size(nextAwards) > 0 ? (
                  map(nextAwards, (item) => (
                    <NextAwardRow
                      key={get(item, "id")}
                      item={item}
                      mode={currentMode}
                      onOpen={openAchievement}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm font-semibold text-muted-foreground md:col-span-2">
                    Hozircha keyingi mukofot yo'q.
                  </div>
                )}
              </CardContent>
            </Card>

            {size(categories) > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-black transition",
                    selectedCategory === null
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  Barchasi
                </button>
                {map(categories, (categoryItem) => {
                  const category = get(categoryItem, "category");
                  const isSelected = category === selectedCategory;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(isSelected ? null : category)
                      }
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition",
                        isSelected
                          ? "bg-foreground text-background"
                          : "bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {getCategoryLabel(category)}
                      <span className="text-xs opacity-70">
                        {formatNumber(get(categoryItem, "count"))}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {size(achievements) > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {map(achievements, (item) => (
                  <AchievementCard
                    key={get(item, "id")}
                    item={item}
                    mode={currentMode}
                    onOpen={openAchievement}
                  />
                ))}
              </div>
            ) : (
              <AchievementsEmptyState />
            )}

            <Button
              type="button"
              variant="outline"
              className="sticky bottom-4 z-10 w-full gap-2 rounded-full bg-background/95 shadow-lg backdrop-blur xl:hidden"
              onClick={() => setXpDrawerOpen(true)}
            >
              <HistoryIcon className="size-4" />
              XP tarixini ochish
            </Button>
          </div>

          <aside className="hidden xl:block">
            <Card className="sticky top-4 rounded-2xl border-border/70 py-0 shadow-none">
              <CardHeader className="px-4 pt-4">
                <CardTitle className="flex items-center gap-2 text-base font-black">
                  <HistoryIcon className="size-4 text-sky-500" />
                  XP tarixi
                </CardTitle>
                <CardDescription>
                  So'nggi XP kirim va chiqimlari.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <XpHistoryContent
                  embedded
                  className="max-h-[min(70vh,42rem)]"
                />
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>

      <Drawer
        direction="bottom"
        open={Boolean(selectedAchievementId)}
        onOpenChange={(open) => {
          if (!open) {
            closeAchievement();
          }
        }}
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <div className="flex flex-col items-center gap-3">
              <AchievementImage
                item={detailItem}
                mode={currentMode}
                className="size-24"
              />
              <div>
                <DrawerTitle className="text-xl font-black">
                  {isDetailFetching && !detailItem
                    ? "Yuklanmoqda..."
                    : get(detailItem, "name", "Achievement")}
                </DrawerTitle>
                <DrawerDescription>
                  {getCategoryLabel(get(detailItem, "category"))}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="space-y-4 pb-6">
            {isDetailError ? (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
                Achievement ma'lumoti topilmadi.
              </div>
            ) : detailItem ? (
              <>
                <p className="text-center text-sm font-medium text-muted-foreground">
                  {get(detailItem, "description")}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border bg-card px-3 py-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground">XP</p>
                    <p className="mt-1 font-black text-amber-600">
                      +{formatCompactNumber(get(detailItem, "xpReward"))}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-card px-3 py-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground">
                      Progress
                    </p>
                    <p className="mt-1 font-black">
                      {get(detailItem, "unlocked")
                        ? "100%"
                        : `${getAchievementProgressPercent(detailItem)}%`}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-card px-3 py-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground">
                      Holat
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-black",
                        get(detailItem, "unlocked")
                          ? "text-emerald-600"
                          : "text-muted-foreground",
                      )}
                    >
                      {get(detailItem, "unlocked") ? "Ochiq" : "Locked"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Yutuq progressi</span>
                    <span className="text-muted-foreground">
                      {formatCompactNumber(get(detailItem, "progress"))}/
                      {formatCompactNumber(get(detailItem, "threshold"))}
                    </span>
                  </div>
                  <Progress
                    value={
                      get(detailItem, "unlocked")
                        ? 100
                        : getAchievementProgressPercent(detailItem)
                    }
                    className="h-2.5 bg-background"
                  />
                  <p className="text-xs font-semibold text-muted-foreground">
                    {get(detailItem, "unlocked")
                      ? `Ochilgan sana: ${formatDate(get(detailItem, "unlockedAt"))}`
                      : `Ochish uchun yana ${formatCompactNumber(
                          Math.max(
                            0,
                            (toNumber(get(detailItem, "threshold")) || 0) -
                              (toNumber(get(detailItem, "progress")) || 0),
                          ),
                        )} qoldi.`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full border font-black",
                      getCategoryBadgeClassName(get(detailItem, "category")),
                    )}
                  >
                    {getCategoryLabel(get(detailItem, "category"))}
                  </Badge>
                  {get(detailItem, "totalUnlockedByUsers") !== undefined ? (
                    <Badge variant="outline" className="rounded-full font-black">
                      {formatNumber(get(detailItem, "totalUnlockedByUsers"))} ta user ochgan
                    </Badge>
                  ) : null}
                  {get(detailItem, "metric") ? (
                    <Badge variant="outline" className="rounded-full font-black">
                      {replace(get(detailItem, "metric"), /_/g, " ")}
                    </Badge>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
                Achievement tanlanmagan.
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Drawer
        direction="bottom"
        open={xpDrawerOpen}
        onOpenChange={setXpDrawerOpen}
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-center gap-2 font-black">
              <HistoryIcon className="size-4 text-sky-500" />
              XP tarixi
            </DrawerTitle>
            <DrawerDescription>
              Scroll qilganda keyingi loglar yuklanadi.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="pb-6">
            <XpHistoryContent
              embedded
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
};

export default AchievementsPage;
