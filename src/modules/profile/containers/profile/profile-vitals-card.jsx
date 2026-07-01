import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  AwardIcon,
  BadgeCheckIcon,
  CakeIcon,
  CalendarIcon,
  CreditCardIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  DumbbellIcon,
  FlameIcon,
  HistoryIcon,
  LockIcon,
  PencilIcon,
  RulerIcon,
  ScaleIcon,
  TargetIcon,
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
import useNutritionDashboard from "@/hooks/app/use-nutrition-dashboard";
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
    iconClass: "bg-warning/10 text-warning",
  },
  {
    value: "maintain",
    label: "Saqlash",
    description: "Kaloriya, oqsil va tiklanish balansini ushlash.",
    icon: ScaleIcon,
    iconClass: "bg-info/10 text-info",
  },
  {
    value: "gain",
    label: "Massa",
    description: "Kaloriya va oqsil targetlarini ko'tarish.",
    icon: TrendingUpIcon,
    iconClass: "bg-success/10 text-success",
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
  "target-weight",
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

const getProfileContactLabel = (user) => {
  const email = get(user, "email");
  const phone = get(user, "phone");
  const username = get(user, "username");

  if (email) return email;
  if (phone) return phone;
  return username ? `@${username}` : "";
};

const getProfilePlanLabel = (user) => {
  const status = get(user, "premium.status");
  const planName =
    get(user, "premium.planName") || get(user, "premium.plan.name");

  if (status === "active" || planName) {
    if (planName && /pro/i.test(planName)) {
      return planName;
    }

    return `${planName || "Liveon"} Pro`;
  }

  return "Free plan";
};

const getProfileTotalLogs = (user, dashboard) => {
  const total =
    get(user, "totalMealsLogged") ??
    get(user, "stats.totalMealsLogged") ??
    get(user, "stats.totalLogs") ??
    get(user, "gamification.totalLogs") ??
    get(dashboard, "meals.completed");

  return Math.max(0, toNumber(total) || 0);
};

const getAchievementImage = (item) =>
  get(item, "imageMadagascarUrl") ||
  get(item, "imageUrl") ||
  get(item, "imageZenUrl") ||
  get(item, "imageFocusUrl") ||
  "";

const normalizeAchievementPreviewItem = (item, index) => ({
  id: get(item, "id") ?? `achievement-${index}`,
  imageUrl: getAchievementImage(item),
  name: get(item, "name") || get(item, "title") || "Achievement",
  unlocked: Boolean(get(item, "unlocked")),
});

const getAchievementPreviewItems = (achievements, fallbackCount = 0) => {
  const source = isArray(achievements) ? achievements : [];

  if (source.length) {
    const unlocked = filter(source, (item) => Boolean(get(item, "unlocked")));
    const locked = filter(source, (item) => !get(item, "unlocked"));
    return [...unlocked, ...locked].slice(0, 3).map(normalizeAchievementPreviewItem);
  }

  const count = Math.max(0, toNumber(fallbackCount) || 0);

  return [
    { id: "fallback-started", name: "Getting started", unlocked: count > 0 },
    { id: "fallback-first-step", name: "First step", unlocked: count > 1 },
    { id: "fallback-locked", name: "Locked", unlocked: false },
  ];
};

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
  const navigate = useNavigate();
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
  const { dashboard } = useNutritionDashboard(undefined, {
    enabled: Boolean(user),
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
  const targetWeight =
    toNumber(get(onboarding, "targetWeight.value")) ||
    toNumber(get(user, "targetWeightValue")) ||
    0;
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
  const achievementCount = getProfileAchievementCount(
    user,
    earnedBadges,
    serverAchievementCount,
  );
  const achievementPreviewItems = React.useMemo(
    () => getAchievementPreviewItems(achievementsPayload, achievementCount),
    [achievementCount, achievementsPayload],
  );
  const profileStreak = getProfileStreak(
    user,
    get(dashboard, "streak.currentDays") || storeStreak,
  );
  const averageCalories =
    toNumber(get(dashboard, "calories.target")) ||
    toNumber(get(dashboard, "goals.calories")) ||
    toNumber(get(healthGoals, "calories")) ||
    0;
  const totalLogs = getProfileTotalLogs(user, dashboard);
  const profileStats = [
    {
      key: "avg-cal",
      label: "Avg. cal",
      value: formatNumber(averageCalories, "0"),
      icon: FlameIcon,
      iconClass: "text-success",
    },
    {
      key: "streak",
      label: "Streak",
      value: formatNumber(profileStreak, "0"),
      icon: FlameIcon,
      iconClass: "text-warning",
    },
    {
      key: "logs",
      label: "Total logs",
      value: formatNumber(totalLogs, "0"),
      icon: CalendarIcon,
      iconClass: "text-info",
    },
  ];
  const profileContact = getProfileContactLabel(user);
  const profilePlanLabel = getProfilePlanLabel(user);
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

  const metricCards = [
    {
      key: "weight",
      label: "Current weight",
      value: currentWeight ? `${formatNumber(currentWeight)} kg` : "-",
      icon: ScaleIcon,
      toneClass: "bg-success/10 text-success",
    },
    {
      key: "target-weight",
      label: "Target weight",
      value: targetWeight ? `${formatNumber(targetWeight)} kg` : "-",
      icon: TargetIcon,
      toneClass: "bg-info/10 text-info",
    },
    {
      key: "height",
      label: "Height",
      value: height ? `${formatNumber(height)} cm` : "-",
      icon: RulerIcon,
      toneClass: "bg-destructive/10 text-destructive",
    },
    {
      key: "age",
      label: "Age",
      value: age ? `${formatNumber(age)} yosh` : "-",
      icon: CakeIcon,
      toneClass: "bg-primary/10 text-primary",
    },
    {
      key: "gender",
      label: "Gender",
      value: getGenderLabel(gender),
      icon: UserIcon,
      toneClass: "bg-secondary text-secondary-foreground",
    },
    {
      key: "goals",
      label: "Goal",
      value: getGoalLabel(goal),
      icon: DumbbellIcon,
      toneClass: "bg-warning/10 text-warning",
    },
  ];

  const handleViewAchievements = React.useCallback(() => {
    navigate("/user/achievements");
  }, [navigate]);

  return (
    <>
      <section className="space-y-7 px-5 pb-0 pt-0">
        <div className="text-center">
          <button
            type="button"
            aria-label="Profilni tahrirlash Ism, avatar va kontaktlar"
            onClick={onEditProfile}
            className="group relative mx-auto mb-4 grid size-28 place-items-center rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            style={{
              background: `conic-gradient(var(--primary) ${completionPercent}%, color-mix(in oklab, var(--primary) 14%, transparent) 0)`,
            }}
          >
            <span
              className="grid size-full place-items-center rounded-full bg-background p-1 shadow-[inset_0_0_0_1px_var(--border)]"
              aria-label={`Profil to'liqligi ${completionPercent}%`}
            >
              <Avatar className="size-24 border-2 border-background shadow-sm">
                <AvatarImage src={user?.avatar} alt={displayName} />
                <AvatarFallback className="text-3xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </span>
            <span className="absolute bottom-1 right-1 grid size-8 place-items-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-colors group-hover:bg-muted">
              <PencilIcon className="size-3.5" />
            </span>
          </button>

          <p className="truncate text-2xl font-black tracking-tight">
            {displayName}
          </p>
          {profileContact ? (
            <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">
              {profileContact}
            </p>
          ) : null}
          <div className="mt-3 flex justify-center">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-black text-primary">
              <BadgeCheckIcon className="size-4 shrink-0" />
              <span className="truncate">{profilePlanLabel}</span>
            </span>
          </div>
        </div>

        <Card
          className={getUserCardClassName("gap-0 overflow-hidden py-0")}
        >
          <CardContent className="grid grid-cols-3 divide-x divide-border/50 px-0 py-4">
            {map(profileStats, (stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.key}
                  aria-label={`${stat.label} ${stat.value}`}
                  className="flex min-w-0 flex-col items-center justify-center px-2 text-center"
                >
                  <span className="text-xs font-bold leading-tight text-muted-foreground">
                    {stat.label}
                  </span>
                  <span className="mt-2 flex max-w-full items-center justify-center gap-1.5">
                    <Icon className={cn("size-5 shrink-0", stat.iconClass)} />
                    <span className="truncate text-2xl font-black leading-none tracking-normal text-foreground tabular-nums">
                      {stat.value}
                    </span>
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black tracking-tight">
              Achievements
            </h2>
            <button
              type="button"
              onClick={handleViewAchievements}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-1 py-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              View all
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
          <Card className={getUserCardClassName("gap-0 overflow-hidden py-0")}>
            <CardContent className="grid grid-cols-3 gap-2 px-3 py-4">
              {map(achievementPreviewItems, (item) => (
                <div
                  key={item.id}
                  className="flex min-w-0 flex-col items-center text-center"
                >
                  <div
                    className={cn(
                      "grid size-16 place-items-center overflow-hidden rounded-2xl border bg-background",
                      item.unlocked
                        ? "border-primary/20 text-primary"
                        : "border-border/70 bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={cn(
                          "size-full object-cover",
                          item.unlocked ? "" : "opacity-50 grayscale",
                        )}
                      />
                    ) : item.unlocked ? (
                      <AwardIcon className="size-8" />
                    ) : (
                      <LockIcon className="size-7" />
                    )}
                  </div>
                  <span className="mt-2 max-w-full truncate text-xs font-bold text-muted-foreground">
                    {item.unlocked ? item.name : "Locked"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-black tracking-tight">
            Fitness metrics
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {map(metricCards, (metric) => {
              const Icon = metric.icon;

              return (
                <button
                  key={metric.key}
                  type="button"
                  aria-label={`${metric.label} ${metric.value}`}
                  onClick={() => setActiveDrawer(metric.key)}
                  className={cn(
                    getUserInteractiveCardClassName(
                      "flex min-h-[9.5rem] min-w-0 flex-col items-center justify-center px-2 py-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    ),
                  )}
                >
                  <span
                    className={cn(
                      "mb-3 grid size-8 place-items-center rounded-xl",
                      metric.toneClass,
                    )}
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <span className="line-clamp-2 min-h-8 text-xs font-bold leading-4 text-muted-foreground">
                    {metric.label}
                  </span>
                  <span className="mt-2 max-w-full truncate text-xl font-black leading-none tracking-normal text-foreground tabular-nums">
                    {metric.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

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
        open={activeDrawer === "target-weight"}
        onOpenChange={(open) =>
          setActiveDrawer(open ? "target-weight" : null)
        }
        title="Maqsad vazn"
        description="Maqsad vazningizni tanlang."
        value={targetWeight}
        fallbackValue={currentWeight || 70}
        unit="kg"
        min={30}
        max={250}
        step={0.5}
        majorStep={5}
        labelStep={10}
        isSaving={onboardingMutation.isPending}
        onSave={(nextTargetWeight) =>
          saveOnboardingPatch(
            { targetWeight: { value: nextTargetWeight, unit: "kg" } },
            { targetWeight: { value: nextTargetWeight, unit: "kg" } },
            "Maqsad vazn yangilandi",
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
