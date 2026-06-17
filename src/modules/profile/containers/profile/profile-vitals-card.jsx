import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCardIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CrownIcon,
  FlameIcon,
  HeartPulseIcon,
  HistoryIcon,
  PencilIcon,
  RulerIcon,
  ScaleIcon,
  TargetIcon,
  TrophyIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserIcon,
  WalletCardsIcon,
} from "lucide-react";
import {
  filter,
  find,
  get,
  includes,
  isArray,
  map,
  size,
  toNumber,
} from "lodash";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useGetQuery, usePutQuery } from "@/hooks/api";
import { ME_QUERY_KEY } from "@/hooks/app/use-me";
import useHealthGoals, {
  HEALTH_GOALS_QUERY_KEY,
} from "@/hooks/app/use-health-goals";
import {
  MEASUREMENTS_QUERY_KEY,
  MEASUREMENTS_TRENDS_QUERY_KEY,
} from "@/hooks/app/use-measurements";
import { getApiResponseData } from "@/lib/api-response";
import { calculateGoals } from "@/lib/goal-calculator";
import { cn } from "@/lib/utils";
import { useAuthStore, useGamificationStore } from "@/store";
import { WeightTicker } from "@/modules/user-onboarding/components/weight-ticker";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import { XpHistoryContent } from "@/modules/user/containers/xp-history";
import {
  getUserAccentCardClassName,
  getUserCardClassName,
  getUserInteractiveCardClassName,
  getUserSurfaceClassName,
  userCardScopeClassName,
} from "@/modules/user/lib/card-styles";

const GENDER_OPTIONS = [
  { value: "male", label: "Erkak", description: "Erkak profili" },
  { value: "female", label: "Ayol", description: "Ayol profili" },
];

const GOAL_OPTIONS = [
  {
    value: "lose",
    label: "Ozish",
    description: "Kaloriya defitsiti va faolroq kunlik ritm.",
    icon: TrendingDownIcon,
    iconClass: "bg-orange-500/10 text-orange-500",
  },
  {
    value: "maintain",
    label: "Saqlash",
    description: "Kaloriya, oqsil va tiklanish balansini ushlash.",
    icon: ScaleIcon,
    iconClass: "bg-sky-500/10 text-sky-500",
  },
  {
    value: "gain",
    label: "Massa",
    description: "Kaloriya va oqsil targetlarini ko'tarish.",
    icon: TrendingUpIcon,
    iconClass: "bg-emerald-500/10 text-emerald-500",
  },
];

const MACRO_FIELDS = [
  { key: "calories", label: "Kaloriya", unit: "kcal" },
  { key: "protein", label: "Oqsil", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
];

const PROFILE_VITAL_DRAWER_IDS = [
  "xp",
  "xp-history",
  "gender",
  "age",
  "weight",
  "height",
  "goals",
  "macros",
];

const XP_WITHDRAW_TARGET = 10000;
const PROFILE_ACHIEVEMENTS_QUERY_KEY = [
  "user",
  "gamification",
  "achievements",
  "all",
];
const PROFILE_STAT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatNumber = (value, fallback = "-") => {
  const numeric = toNumber(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }

  return Number.isInteger(numeric)
    ? String(numeric)
    : numeric.toFixed(1).replace(/\.0$/, "");
};

const formatCompactNumber = (value) => {
  const numeric = toNumber(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("en-US") : "0";
};

const formatProfileStatNumber = (value) => {
  const numeric = Math.max(0, toNumber(value) || 0);
  return PROFILE_STAT_NUMBER_FORMATTER.format(numeric);
};

const getProfileXp = (user, fallbackXp) => {
  const userXp = get(user, "xp");

  if (userXp !== undefined && userXp !== null) {
    return Math.max(0, toNumber(userXp) || 0);
  }

  return Math.max(0, toNumber(fallbackXp) || 0);
};

const getProfileStreak = (user, fallbackStreak) => {
  const streak =
    get(user, "streak") ??
    get(user, "currentStreak") ??
    get(user, "stats.currentStreak") ??
    get(user, "gamification.streak") ??
    fallbackStreak;

  return Math.max(0, toNumber(streak) || 0);
};

const getProfileAchievementCount = (
  user,
  fallbackBadges = [],
  serverAchievementCount = null,
) => {
  const directCount =
    get(user, "achievementCount") ??
    get(user, "achievementsCount") ??
    get(user, "stats.achievementCount") ??
    get(user, "stats.unlockedAchievements") ??
    get(user, "gamification.achievementCount");

  if (directCount !== undefined && directCount !== null) {
    return Math.max(0, toNumber(directCount) || 0);
  }

  if (serverAchievementCount !== undefined && serverAchievementCount !== null) {
    return Math.max(0, toNumber(serverAchievementCount) || 0);
  }

  const userBadges =
    get(user, "earnedBadges") ??
    get(user, "badges") ??
    get(user, "achievements");

  if (isArray(userBadges)) {
    return size(userBadges);
  }

  return isArray(fallbackBadges) ? size(fallbackBadges) : 0;
};

const getUnlockedAchievementCount = (achievements) =>
  isArray(achievements) ? size(filter(achievements, { unlocked: true })) : null;

const getGenderLabel = (value) =>
  find(GENDER_OPTIONS, (item) => item.value === value)?.label ?? "Tanlanmagan";

const getGoalLabel = (value) => {
  switch (value) {
    case "lose":
      return "Vazn kamaytirish";
    case "gain":
      return "Vazn oshirish";
    case "maintain":
      return "Saqlash";
    default:
      return "Ko'rish";
  }
};

const setMeUserCache = (queryClient, nextUser) => {
  queryClient.setQueryData(ME_QUERY_KEY, (previousValue) => {
    if (previousValue?.data && "data" in previousValue.data) {
      return {
        ...previousValue,
        data: {
          ...previousValue.data,
          data: nextUser,
        },
      };
    }

    if (previousValue && "data" in previousValue) {
      return {
        ...previousValue,
        data: nextUser,
      };
    }

    return { data: nextUser };
  });
};

const buildRecommendedGoalPatch = (goal, onboarding = {}) => ({
  goal,
  ...calculateGoals({
    gender: get(onboarding, "gender"),
    age: get(onboarding, "age"),
    heightValue: get(onboarding, "height.value"),
    currentWeightValue: get(onboarding, "currentWeight.value"),
    goal,
    activityLevel: get(onboarding, "activityLevel"),
    weeklyPace: get(onboarding, "weeklyPace"),
  }),
});

const createMacroDraft = (targets = {}) => ({
  calories: String(toNumber(get(targets, "calories")) || 0),
  protein: String(toNumber(get(targets, "protein")) || 0),
  carbs: String(toNumber(get(targets, "carbs")) || 0),
  fat: String(toNumber(get(targets, "fat")) || 0),
});

const toMacroPayload = (draft, goal) => ({
  goal,
  calories: toNumber(draft.calories) || 0,
  protein: toNumber(draft.protein) || 0,
  carbs: toNumber(draft.carbs) || 0,
  fat: toNumber(draft.fat) || 0,
});

const XpBalanceDrawer = ({ open, onOpenChange, xp }) => {
  const { openProfileDrawer } = useProfileOverlay();
  const currentXp = Math.max(0, toNumber(xp) || 0);
  const progress = Math.min(
    100,
    Math.round((currentXp / XP_WITHDRAW_TARGET) * 100),
  );
  const remainingXp = Math.max(0, XP_WITHDRAW_TARGET - currentXp);

  const handleHistoryClick = () => {
    openProfileDrawer("xp-history", PROFILE_OVERVIEW_TAB);
  };

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
          userCardScopeClassName,
        )}
      >
        <DrawerHeader>
          <DrawerTitle>XP balans</DrawerTitle>
          <DrawerDescription>
            XP jamg'armangiz va barcha ishlagan loglaringiz.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-4 px-5 pb-5">
          <div className={getUserAccentCardClassName("p-5")}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
              <WalletCardsIcon className="size-4" />
              <span>Joriy balans</span>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-black leading-none text-primary">
                {formatCompactNumber(currentXp)}
              </span>
              <span className="pb-1 text-lg font-black text-primary">XP</span>
            </div>

            <Button
              type="button"
              className="mt-5 h-12 w-full rounded-full text-base font-black"
              disabled={currentXp < XP_WITHDRAW_TARGET}
            >
              <CreditCardIcon className="size-5" />
              Kartaga yechib olish
            </Button>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Yechib olishgacha
                </span>
                <span className="shrink-0 font-bold text-muted-foreground">
                  {formatCompactNumber(currentXp)} /{" "}
                  {formatCompactNumber(XP_WITHDRAW_TARGET)} XP
                </span>
              </div>
              <Progress value={progress} className="h-2 bg-primary/10" />
              {remainingXp > 0 ? (
                <p className="text-xs font-medium text-muted-foreground">
                  Yana {formatCompactNumber(remainingXp)} XP kerak.
                </p>
              ) : (
                <p className="text-xs font-medium text-primary">
                  Yechib olish uchun yetarli XP bor.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleHistoryClick}
            className={getUserInteractiveCardClassName(
              "flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none",
            )}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HistoryIcon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black">XP tarixi</span>
              <span className="mt-0.5 block truncate text-sm font-medium text-muted-foreground">
                Barcha XP ishlagan loglarini ko'rish
              </span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
          </button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

const XpHistoryProfileDrawer = ({ open, onOpenChange }) => (
  <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
    <DrawerContent
      data-profile-overview-drawer="xp-history"
      className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
    >
      <DrawerHeader className="border-b border-border/50 px-5 pb-3 pt-4 text-left">
        <DrawerTitle>XP tarixi</DrawerTitle>
        <DrawerDescription>
          Barcha XP ishlagan va sarflagan loglaringiz.
        </DrawerDescription>
      </DrawerHeader>

      <DrawerBody className="px-3 pb-5 pt-3">
        <XpHistoryContent embedded />
      </DrawerBody>
    </DrawerContent>
  </Drawer>
);

const GenderVitalDrawer = ({
  open,
  onOpenChange,
  value,
  onSave,
  isSaving,
}) => {
  const [draft, setDraft] = React.useState(value || "male");

  React.useEffect(() => {
    if (!open) return undefined;

    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) {
        setDraft(value || "male");
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [open, value]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        className={cn(
          "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
          userCardScopeClassName,
        )}
      >
        <DrawerHeader>
          <DrawerTitle>Jinsi</DrawerTitle>
          <DrawerDescription>Profil jinsini tanlang.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-2 px-4">
          {map(GENDER_OPTIONS, (option) => {
            const active = draft === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraft(option.value)}
                className={cn(
                  getUserInteractiveCardClassName(
                    "flex w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60",
                  ),
                  active && "border border-primary bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground",
                    active && "bg-primary text-primary-foreground",
                  )}
                >
                  <UserIcon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold leading-tight">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
                {active ? (
                  <CheckCircle2Icon className="size-5 shrink-0 text-primary" />
                ) : null}
              </button>
            );
          })}
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            className="h-11"
            disabled={isSaving}
            onClick={() => onSave(draft)}
          >
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const NumericVitalDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  value,
  fallbackValue,
  unit,
  min,
  max,
  step,
  majorStep,
  labelStep,
  onSave,
  isSaving,
}) => {
  const [draft, setDraft] = React.useState(String(value || fallbackValue));

  React.useEffect(() => {
    if (!open) return undefined;

    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) {
        setDraft(String(value || fallbackValue));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [fallbackValue, open, value]);

  const displayValue = formatNumber(draft, String(fallbackValue));

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        className={cn(
          "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
          userCardScopeClassName,
        )}
      >
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="px-4 pb-4">
          <div
            className={getUserSurfaceClassName("p-4")}
            data-vaul-no-drag
          >
            <div className="mb-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Hozirgi qiymat
              </p>
              <p className="mt-1 text-5xl font-black tabular-nums leading-none">
                {displayValue}
                <span className="ml-1 text-xl font-bold text-muted-foreground">
                  {unit}
                </span>
              </p>
            </div>
            <div className="flex justify-center">
              <WeightTicker
                value={draft}
                onChange={setDraft}
                min={min}
                max={max}
                step={step}
                majorStep={majorStep}
                labelStep={labelStep}
                unit={unit}
                ariaLabel={title}
                orientation="vertical"
                verticalHeight={250}
                showValue={false}
              />
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            className="h-11"
            disabled={isSaving}
            onClick={() => onSave(toNumber(draft))}
          >
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const GoalSelectionDrawer = ({
  open,
  onOpenChange,
  value,
  onSelect,
  isSaving,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent
      className={cn(
        "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
        userCardScopeClassName,
      )}
    >
      <DrawerHeader>
        <DrawerTitle>Maqsadni tanlang</DrawerTitle>
        <DrawerDescription>
          Tanlangan maqsad bo'yicha kaloriya va macro targetlar tayyorlanadi.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="space-y-2 px-4 pb-4">
        {map(GOAL_OPTIONS, (option) => {
          const active = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isSaving}
              onClick={() => onSelect(option.value)}
              className={cn(
                getUserInteractiveCardClassName(
                  "flex w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60",
                ),
                active && "border border-primary bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                  option.iconClass,
                  active && "bg-primary text-primary-foreground",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold leading-tight">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {option.description}
                </span>
              </span>
              {active ? (
                <CheckCircle2Icon className="size-5 shrink-0 text-primary" />
              ) : null}
            </button>
          );
        })}
      </DrawerBody>
      <DrawerFooter className="pt-0">
        <p className="text-center text-xs text-muted-foreground">
          {isSaving
            ? "Maqsad saqlanmoqda..."
            : "Tanlangandan so'ng keyingi oynada targetlarni tahrirlaysiz."}
        </p>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

const MacroTargetsDrawer = ({
  open,
  onOpenChange,
  targets,
  goal,
  onSave,
  isSaving,
}) => {
  const [draft, setDraft] = React.useState(() => createMacroDraft(targets));

  React.useEffect(() => {
    if (!open) return undefined;

    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) {
        setDraft(createMacroDraft(targets));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [open, targets]);

  const handleDraftChange = React.useCallback((key, value) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const handleSave = React.useCallback(() => {
    onSave(toMacroPayload(draft, goal));
  }, [draft, goal, onSave]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        className={cn(
          "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
          userCardScopeClassName,
        )}
      >
        <DrawerHeader>
          <DrawerTitle>Kaloriya va macro targetlar</DrawerTitle>
          <DrawerDescription>
            Kunlik kaloriya, oqsil, carbs va fat qiymatlarini tahrirlang.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-3 px-4 pb-4">
          <div className={getUserSurfaceClassName("p-4")}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TargetIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{getGoalLabel(goal)}</p>
                <p className="text-xs text-muted-foreground">
                  Bu qiymatlar nutrition targetlarga saqlanadi.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {map(MACRO_FIELDS, (field) => {
              const inputId = `profile-goal-${field.key}`;

              return (
                <label
                  key={field.key}
                  htmlFor={inputId}
                  className={getUserSurfaceClassName(
                    "grid gap-1.5 px-4 py-3",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{field.label}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {field.unit}
                    </span>
                  </span>
                  <Input
                    id={inputId}
                    aria-label={field.label}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={draft[field.key]}
                    onChange={(event) =>
                      handleDraftChange(field.key, event.target.value)
                    }
                    className="h-11 rounded-xl border-border/70 text-base font-bold tabular-nums"
                  />
                </label>
              );
            })}
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            className="h-11"
            disabled={isSaving}
            onClick={handleSave}
          >
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const ProfileVitalsCard = ({
  user,
  displayName,
  initials,
  completion = 0,
  onEditProfile,
}) => {
  const queryClient = useQueryClient();
  const initializeUser = useAuthStore((state) => state.initializeUser);
  const storeXp = useGamificationStore((state) => state.xp);
  const storeStreak = useGamificationStore((state) => state.streak);
  const earnedBadges = useGamificationStore((state) => state.earnedBadges);
  const onboardingMutation = usePutQuery();
  const heightMutation = usePutQuery();
  const { data: achievementsData } = useGetQuery({
    url: "/user/gamification/achievements",
    queryProps: {
      queryKey: PROFILE_ACHIEVEMENTS_QUERY_KEY,
      enabled: Boolean(user),
    },
  });
  const {
    goals: healthGoals,
    saveGoals,
    isSaving: isSavingHealthGoals,
    hasServerGoals,
  } = useHealthGoals();
  const {
    activeProfileDrawer,
    closeProfileDrawer,
    openProfileDrawer,
  } = useProfileOverlay();
  const routedActiveDrawer = includes(
    PROFILE_VITAL_DRAWER_IDS,
    activeProfileDrawer,
  )
    ? activeProfileDrawer
    : null;
  const [localActiveDrawer, setLocalActiveDrawer] = React.useState(null);
  const activeDrawer = routedActiveDrawer ?? localActiveDrawer;
  const [macroTargets, setMacroTargets] = React.useState(null);
  const [isGoalsSaving, setIsGoalsSaving] = React.useState(false);
  const setActiveDrawer = React.useCallback(
    (drawerId) => {
      if (includes(PROFILE_VITAL_DRAWER_IDS, drawerId)) {
        openProfileDrawer(drawerId, PROFILE_OVERVIEW_TAB);
        return;
      }

      if (routedActiveDrawer) {
        closeProfileDrawer();
        return;
      }

      setLocalActiveDrawer(drawerId);
    },
    [closeProfileDrawer, openProfileDrawer, routedActiveDrawer],
  );

  const onboarding = React.useMemo(
    () => user?.onboarding ?? {},
    [user?.onboarding],
  );
  const gender = get(onboarding, "gender");
  const age = toNumber(get(onboarding, "age")) || 0;
  const currentWeight = toNumber(get(onboarding, "currentWeight.value")) || 0;
  const height = toNumber(get(onboarding, "height.value")) || 0;
  const onboardingGoal = get(onboarding, "goal") ?? get(user, "healthGoals.goal");
  const goal =
    get(macroTargets, "goal") ??
    (hasServerGoals ? get(healthGoals, "goal") : onboardingGoal) ??
    get(healthGoals, "goal");
  const macroDrawerTargets = macroTargets ?? healthGoals;
  const macroDrawerKey = `${goal}-${get(macroDrawerTargets, "calories")}-${get(
    macroDrawerTargets,
    "protein",
  )}-${get(macroDrawerTargets, "carbs")}-${get(macroDrawerTargets, "fat")}`;
  const profileXp = getProfileXp(user, storeXp);
  const achievementsPayload = getApiResponseData(achievementsData, null);
  const serverAchievementCount = getUnlockedAchievementCount(
    achievementsPayload,
  );
  const profileStats = [
    {
      key: "streak",
      label: "Streak",
      value: formatProfileStatNumber(getProfileStreak(user, storeStreak)),
      icon: FlameIcon,
      iconClass: "text-amber-500",
    },
    {
      key: "xp",
      label: "XP",
      value: formatProfileStatNumber(profileXp),
      icon: CrownIcon,
      iconClass: "text-sky-500",
      onClick: () => setActiveDrawer("xp"),
    },
    {
      key: "achievement",
      label: "Achievement",
      value: formatProfileStatNumber(
        getProfileAchievementCount(user, earnedBadges, serverAchievementCount),
      ),
      icon: TrophyIcon,
      iconClass: "text-emerald-500",
    },
  ];
  const completionPercent = Math.max(
    0,
    Math.min(100, Math.round(toNumber(completion) || 0)),
  );

  const invalidateVitals = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: HEALTH_GOALS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: MEASUREMENTS_QUERY_KEY }),
      queryClient.invalidateQueries({
        queryKey: MEASUREMENTS_TRENDS_QUERY_KEY,
      }),
    ]);
  }, [queryClient]);

  const syncLocalOnboarding = React.useCallback(
    (patch) => {
      if (!user) {
        return;
      }

      const nextUser = {
        ...user,
        onboarding: {
          ...(user.onboarding ?? {}),
          ...patch,
        },
      };
      initializeUser(nextUser);
      setMeUserCache(queryClient, nextUser);
    },
    [initializeUser, queryClient, user],
  );

  const saveOnboardingPatch = React.useCallback(
    async (attributes, localPatch, successMessage) => {
      try {
        await onboardingMutation.mutateAsync({
          url: "/user/onboarding/user",
          attributes,
        });
        syncLocalOnboarding(localPatch);
        await invalidateVitals();
        toast.success(successMessage);
        setActiveDrawer(null);
      } catch {
        toast.error("Profil ma'lumotini saqlab bo'lmadi");
      }
    },
    [invalidateVitals, onboardingMutation, syncLocalOnboarding],
  );

  const saveHeight = React.useCallback(
    async (nextHeight) => {
      try {
        await heightMutation.mutateAsync({
          url: "/user/measurements/height",
          attributes: { value: nextHeight, unit: "cm" },
        });
        syncLocalOnboarding({ height: { value: nextHeight, unit: "cm" } });
        await invalidateVitals();
        toast.success("Bo'y yangilandi");
        setActiveDrawer(null);
      } catch {
        toast.error("Bo'yni saqlab bo'lmadi");
      }
    },
    [heightMutation, invalidateVitals, syncLocalOnboarding],
  );

  const handleGoalSelect = React.useCallback(
    async (nextGoal) => {
      const recommendedPatch = buildRecommendedGoalPatch(nextGoal, onboarding);

      setIsGoalsSaving(true);

      try {
        const savedGoals = await saveGoals(recommendedPatch);
        const nextTargets = {
          ...healthGoals,
          ...recommendedPatch,
          ...(savedGoals ?? {}),
        };

        setMacroTargets(nextTargets);
        syncLocalOnboarding({ goal: get(nextTargets, "goal") ?? nextGoal });
        toast.success("Maqsad yangilandi");
        setActiveDrawer("macros");
      } catch {
        toast.error("Maqsadni saqlab bo'lmadi");
      } finally {
        setIsGoalsSaving(false);
      }
    },
    [healthGoals, onboarding, saveGoals, syncLocalOnboarding],
  );

  const handleMacroTargetsSave = React.useCallback(
    async (patch) => {
      const nextPatch = {
        ...patch,
        goal: patch.goal ?? goal,
      };

      setIsGoalsSaving(true);

      try {
        const savedGoals = await saveGoals(nextPatch);
        const nextTargets = {
          ...healthGoals,
          ...(macroTargets ?? {}),
          ...nextPatch,
          ...(savedGoals ?? {}),
        };

        setMacroTargets(nextTargets);
        syncLocalOnboarding({
          goal: get(nextTargets, "goal") ?? nextPatch.goal,
        });
        toast.success("Nutrition targetlar yangilandi");
        setActiveDrawer(null);
      } catch {
        toast.error("Targetlarni saqlab bo'lmadi");
      } finally {
        setIsGoalsSaving(false);
      }
    },
    [goal, healthGoals, macroTargets, saveGoals, syncLocalOnboarding],
  );

  const rows = [
    {
      key: "profile",
      label: "Profilni tahrirlash",
      value: "Ism, avatar va kontaktlar",
      icon: PencilIcon,
      onClick: onEditProfile,
    },
    {
      key: "goals",
      label: "Maqsad",
      value: getGoalLabel(goal),
      icon: HeartPulseIcon,
    },
    {
      key: "gender",
      label: "Jinsi",
      value: getGenderLabel(gender),
      icon: UserIcon,
    },
    {
      key: "age",
      label: "Yoshi",
      value: age ? `${formatNumber(age)} yosh` : "Kiritilmagan",
      icon: UserIcon,
    },
    {
      key: "weight",
      label: "Vazn",
      value: currentWeight
        ? `${formatNumber(currentWeight)} kg`
        : "Kiritilmagan",
      icon: ScaleIcon,
    },
    {
      key: "height",
      label: "Bo'y",
      value: height ? `${formatNumber(height)} cm` : "Kiritilmagan",
      icon: RulerIcon,
    },
  ];

  return (
    <>
      <section className="px-5 pb-0 pt-0 text-center">
        <div
          className="relative mx-auto mb-3 grid size-28 place-items-center rounded-full p-1.5"
          style={{
            background: `conic-gradient(var(--primary) ${completionPercent}%, color-mix(in oklab, var(--primary) 14%, transparent) 0)`,
          }}
          aria-label={`Profil to'liqligi ${completionPercent}%`}
        >
          <div className="grid size-full place-items-center rounded-full bg-background p-1 shadow-[inset_0_0_0_1px_var(--border)]">
            <Avatar className="size-24 border-2 border-background shadow-sm">
              <AvatarImage src={user?.avatar} alt={displayName} />
              <AvatarFallback className="text-3xl font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <p className="truncate text-lg font-black tracking-tight">
          {displayName}
        </p>
        {user?.username ? (
          <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">
            @{user.username}
          </p>
        ) : user?.email || user?.phone ? (
          <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">
            {user.email || user.phone}
          </p>
        ) : null}
        <div
          data-testid="profile-stat-grid"
          className="-mx-5 mt-3 grid grid-cols-3 gap-2"
        >
          {map(profileStats, (stat) => {
            const Icon = stat.icon;
            const ariaLabel = `${stat.label} ${stat.value}`;
            const handleStatKeyDown = (event) => {
              if (event.key !== "Enter" && event.key !== " ") {
                return;
              }

              event.preventDefault();
              stat.onClick?.();
            };

            return (
              <Card
                key={stat.key}
                size="sm"
                aria-label={ariaLabel}
                role={stat.onClick ? "button" : undefined}
                tabIndex={stat.onClick ? 0 : undefined}
                onClick={stat.onClick}
                onKeyDown={stat.onClick ? handleStatKeyDown : undefined}
                className={cn(
                  getUserCardClassName(
                    "w-full min-w-0 gap-0 !py-0 text-center data-[size=sm]:!gap-0 data-[size=sm]:!pb-0 data-[size=sm]:!pt-0",
                  ),
                  stat.onClick
                    ? "cursor-pointer transition-colors hover:bg-primary/10 focus-visible:outline-none"
                    : "cursor-default",
                )}
              >
                <CardContent className="flex min-h-16 min-w-0 flex-col items-center justify-center !px-1.5 py-2">
                  <span className="flex min-w-0 items-center justify-center gap-1 text-[10px] font-black text-muted-foreground">
                    <Icon
                      className={cn("size-3.5 shrink-0", stat.iconClass)}
                    />
                    <span className="truncate">{stat.label}</span>
                  </span>
                  <span className="mt-1 block max-w-full truncate text-xl font-black leading-none tracking-normal text-foreground tabular-nums">
                    {stat.value}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className={getUserSurfaceClassName("overflow-hidden")}>
        {map(rows, (row, index) => {
          const Icon = row.icon;
          return (
            <React.Fragment key={row.key}>
              {index > 0 ? (
                <div className="mx-6 border-t border-border/50 sm:mx-7" />
              ) : null}
              <button
                type="button"
                aria-label={`${row.label} ${row.value}`}
                onClick={() =>
                  row.onClick ? row.onClick() : setActiveDrawer(row.key)
                }
                className="flex w-full items-center gap-3.5 px-6 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-7"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground">
                  <Icon className="size-4.5" />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="truncate text-sm font-medium sm:text-[15px]">
                    {row.label}
                  </span>
                  <span className="ml-auto max-w-[48%] truncate text-right text-xs text-muted-foreground sm:text-sm">
                    {row.value}
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <GoalSelectionDrawer
        open={activeDrawer === "goals"}
        onOpenChange={(open) => setActiveDrawer(open ? "goals" : null)}
        value={goal}
        isSaving={isGoalsSaving || isSavingHealthGoals}
        onSelect={handleGoalSelect}
      />
      <MacroTargetsDrawer
        key={macroDrawerKey}
        open={activeDrawer === "macros"}
        onOpenChange={(open) => setActiveDrawer(open ? "macros" : null)}
        targets={macroDrawerTargets}
        goal={goal}
        isSaving={isGoalsSaving || isSavingHealthGoals}
        onSave={handleMacroTargetsSave}
      />
      <GenderVitalDrawer
        open={activeDrawer === "gender"}
        onOpenChange={(open) => setActiveDrawer(open ? "gender" : null)}
        value={gender}
        isSaving={onboardingMutation.isPending}
        onSave={(nextGender) =>
          saveOnboardingPatch(
            { gender: nextGender },
            { gender: nextGender },
            "Jins yangilandi",
          )
        }
      />
      <NumericVitalDrawer
        open={activeDrawer === "age"}
        onOpenChange={(open) => setActiveDrawer(open ? "age" : null)}
        title="Yoshi"
        description="Yoshingizni tanlang."
        value={age}
        fallbackValue={26}
        unit="yosh"
        min={13}
        max={120}
        step={1}
        majorStep={5}
        labelStep={10}
        isSaving={onboardingMutation.isPending}
        onSave={(nextAge) =>
          saveOnboardingPatch(
            { age: nextAge },
            { age: nextAge },
            "Yosh yangilandi",
          )
        }
      />
      <NumericVitalDrawer
        open={activeDrawer === "weight"}
        onOpenChange={(open) => setActiveDrawer(open ? "weight" : null)}
        title="Vazn"
        description="Hozirgi vazningizni tanlang."
        value={currentWeight}
        fallbackValue={70}
        unit="kg"
        min={20}
        max={300}
        step={0.5}
        majorStep={5}
        labelStep={10}
        isSaving={onboardingMutation.isPending}
        onSave={(nextWeight) =>
          saveOnboardingPatch(
            { currentWeight: { value: nextWeight, unit: "kg" } },
            { currentWeight: { value: nextWeight, unit: "kg" } },
            "Vazn yangilandi",
          )
        }
      />
      <NumericVitalDrawer
        open={activeDrawer === "height"}
        onOpenChange={(open) => setActiveDrawer(open ? "height" : null)}
        title="Bo'y"
        description="Bo'yingizni tanlang."
        value={height}
        fallbackValue={170}
        unit="cm"
        min={100}
        max={250}
        step={1}
        majorStep={10}
        labelStep={10}
        isSaving={heightMutation.isPending}
        onSave={saveHeight}
      />
      <XpBalanceDrawer
        open={activeDrawer === "xp"}
        onOpenChange={(open) => setActiveDrawer(open ? "xp" : null)}
        xp={profileXp}
      />
      <XpHistoryProfileDrawer
        open={activeDrawer === "xp-history"}
        onOpenChange={(open) => setActiveDrawer(open ? "xp-history" : null)}
      />
    </>
  );
};

export default ProfileVitalsCard;
