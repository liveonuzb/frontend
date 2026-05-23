import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  CreditCardIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CrownIcon,
  HeartPulseIcon,
  HistoryIcon,
  PencilIcon,
  RulerIcon,
  ScaleIcon,
  UserIcon,
  WalletCardsIcon,
} from "lucide-react";
import { get, map, toNumber } from "lodash";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { usePutQuery } from "@/hooks/api";
import { ME_QUERY_KEY } from "@/hooks/app/use-me";
import { HEALTH_GOALS_QUERY_KEY } from "@/hooks/app/use-health-goals";
import {
  MEASUREMENTS_QUERY_KEY,
  MEASUREMENTS_TRENDS_QUERY_KEY,
} from "@/hooks/app/use-measurements";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { WeightTicker } from "@/modules/user-onboarding/components/weight-ticker";

const GENDER_OPTIONS = [
  { value: "male", label: "Erkak", description: "Erkak profili" },
  { value: "female", label: "Ayol", description: "Ayol profili" },
];

const XP_WITHDRAW_TARGET = 10000;

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

const getGenderLabel = (value) =>
  GENDER_OPTIONS.find((item) => item.value === value)?.label ?? "Tanlanmagan";

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

const XpBalanceDrawer = ({ open, onOpenChange, xp }) => {
  const navigate = useNavigate();
  const currentXp = Math.max(0, toNumber(xp) || 0);
  const progress = Math.min(
    100,
    Math.round((currentXp / XP_WITHDRAW_TARGET) * 100),
  );
  const remainingXp = Math.max(0, XP_WITHDRAW_TARGET - currentXp);

  const handleHistoryClick = () => {
    onOpenChange(false);
    navigate("/user/xp-history");
  };

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:!mx-auto data-[vaul-drawer-direction=bottom]:!max-w-md">
        <DrawerHeader>
          <DrawerTitle>XP balans</DrawerTitle>
          <DrawerDescription>
            XP jamg'armangiz va barcha ishlagan loglaringiz.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-4 px-5 pb-5">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-sm">
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
            className="flex w-full items-center gap-4 rounded-3xl border border-border/70 bg-card px-5 py-4 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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

const stopDrawerDrag = (event) => {
  event.stopPropagation();
};

const GenderVitalDrawer = ({
  open,
  onOpenChange,
  value,
  onSave,
  isSaving,
}) => {
  const [draft, setDraft] = React.useState(value || "male");

  React.useEffect(() => {
    if (open) {
      setDraft(value || "male");
    }
  }, [open, value]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:!mx-auto data-[vaul-drawer-direction=bottom]:!max-w-md">
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
                  "flex w-full items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50",
                  active && "border-primary bg-primary/10",
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
    if (open) {
      setDraft(String(value || fallbackValue));
    }
  }, [fallbackValue, open, value]);

  const displayValue = formatNumber(draft, String(fallbackValue));

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:!mx-auto data-[vaul-drawer-direction=bottom]:!max-w-md">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="px-4 pb-4">
          <div
            className="rounded-3xl border bg-card p-4"
            data-vaul-no-drag
            onPointerDown={stopDrawerDrag}
            onMouseDown={stopDrawerDrag}
            onTouchStart={stopDrawerDrag}
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

export const ProfileVitalsCard = ({
  user,
  displayName,
  initials,
  completion = 0,
  onEditProfile,
  onOpenPremium,
  onOpenGoals,
}) => {
  const queryClient = useQueryClient();
  const initializeUser = useAuthStore((state) => state.initializeUser);
  const onboardingMutation = usePutQuery();
  const heightMutation = usePutQuery();
  const [activeDrawer, setActiveDrawer] = React.useState(null);

  const onboarding = user?.onboarding ?? {};
  const gender = get(onboarding, "gender");
  const age = toNumber(get(onboarding, "age")) || 0;
  const currentWeight = toNumber(get(onboarding, "currentWeight.value")) || 0;
  const height = toNumber(get(onboarding, "height.value")) || 0;
  const goal = get(onboarding, "goal") ?? get(user, "healthGoals.goal");
  const isPremiumActive = user?.premium?.status === "active";
  const premiumLabel = isPremiumActive ? "Premium" : null;
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

  const rows = [
    {
      key: "profile",
      label: "Profilni tahrirlash",
      value: "Ism, avatar va kontaktlar",
      icon: PencilIcon,
      onClick: onEditProfile,
    },
    {
      key: "premium",
      label: "Premium",
      value: isPremiumActive ? premiumLabel : "Qayta sotib olish",
      icon: CrownIcon,
      onClick: onOpenPremium,
    },
    {
      key: "goals",
      label: "Maqsad",
      value: getGoalLabel(goal),
      icon: HeartPulseIcon,
      onClick: onOpenGoals,
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
      <section className="px-5 pb-2 pt-1 text-center">
        <div
          className="relative mx-auto mb-5 grid size-40 place-items-center rounded-full p-2"
          style={{
            background: `conic-gradient(var(--primary) ${completionPercent}%, color-mix(in oklab, var(--primary) 14%, transparent) 0)`,
          }}
          aria-label={`Profil to'liqligi ${completionPercent}%`}
        >
          <div className="grid size-full place-items-center rounded-full bg-background p-2 shadow-[inset_0_0_0_1px_var(--border)]">
            <Avatar className="size-32 border-4 border-background shadow-sm">
              <AvatarImage src={user?.avatar} alt={displayName} />
              <AvatarFallback className="text-4xl font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          {premiumLabel ? (
            <span className="absolute -bottom-2 left-1/2 inline-flex min-h-10 -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-black leading-tight text-white shadow-sm">
              <CrownIcon className="size-3.5 shrink-0 text-white" />
              <span className="max-w-28 whitespace-normal text-center">
                {premiumLabel}
              </span>
            </span>
          ) : null}
        </div>
        <p className="truncate text-2xl font-black tracking-tight">
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
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveDrawer("xp")}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-bold text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CrownIcon className="size-3.5" />
            {formatCompactNumber(user?.xp)} XP
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-none">
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
        xp={user?.xp}
      />
    </>
  );
};

export default ProfileVitalsCard;
