import { filter, includes, isArray, join, map } from "lodash";
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore, useAuthStore } from "@/store";
import {
  BeefIcon,
  CheckIcon,
  CircleSlashIcon,
  FlameIcon,
  LeafIcon,
  Loader2Icon,
  MilkOffIcon,
  SaladIcon,
  ShieldCheckIcon,
  WheatOffIcon,
} from "lucide-react";
import { usePutQuery } from "@/hooks/api";
import {
  normalizeUserOnboarding,
  toUserOnboardingPayload,
} from "@/lib/user-onboarding";
import { toast } from "sonner";
import { getUserOnboardingReportPath } from "@/lib/app-paths";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const restrictions = [
  {
    value: "none",
    labelKey: "none",
    descriptionKey: "noneDescription",
    icon: CircleSlashIcon,
  },
  {
    value: "vegetarian",
    labelKey: "vegetarian",
    descriptionKey: "vegetarianDescription",
    icon: LeafIcon,
  },
  {
    value: "vegan",
    labelKey: "vegan",
    descriptionKey: "veganDescription",
    icon: SaladIcon,
  },
  {
    value: "gluten-free",
    labelKey: "glutenFree",
    descriptionKey: "glutenFreeDescription",
    icon: WheatOffIcon,
  },
  {
    value: "lactose-free",
    labelKey: "lactoseFree",
    descriptionKey: "lactoseFreeDescription",
    icon: MilkOffIcon,
  },
  {
    value: "halal",
    labelKey: "halal",
    descriptionKey: "halalDescription",
    icon: ShieldCheckIcon,
  },
  {
    value: "keto",
    labelKey: "keto",
    descriptionKey: "ketoDescription",
    icon: FlameIcon,
  },
  {
    value: "paleo",
    labelKey: "paleo",
    descriptionKey: "paleoDescription",
    icon: BeefIcon,
  },
];

const goalIllustrations = {
  lose: "/onboarding/lose.png",
  maintain: "/onboarding/maintain.png",
  gain: "/onboarding/gain.png",
};

const getRestrictionTone = (selectedValue, goal) => {
  if (selectedValue === "vegetarian" || selectedValue === "vegan") {
    return ONBOARDING_ACCENTS.green;
  }
  if (selectedValue === "gluten-free" || selectedValue === "lactose-free") {
    return ONBOARDING_ACCENTS.sky;
  }
  if (selectedValue === "halal") {
    return ONBOARDING_ACCENTS.amber;
  }
  if (selectedValue === "keto" || selectedValue === "paleo") {
    return ONBOARDING_ACCENTS.rose;
  }
  if (goal === "lose") return ONBOARDING_ACCENTS.rose;
  if (goal === "gain") return ONBOARDING_ACCENTS.blue;
  return ONBOARDING_ACCENTS.green;
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const onboardingState = useOnboardingStore();
  const { dietRestrictions, reset, setField, goal } = onboardingState;
  const { initializeUser, setOnboardingCompleted, user } = useAuthStore();

  useOnboardingAutoSave("user", "diet-restrictions");

  const { mutateAsync: completeOnboarding, isPending } = usePutQuery({
    mutationProps: {
      onSuccess: async (_data, variables) => {
        const nextOnboarding = normalizeUserOnboarding(variables?.attributes);
        const nextUser = user
          ? {
              ...user,
              onboardingCompleted: true,
              onboarding: nextOnboarding,
            }
          : user;

        setOnboardingCompleted(true);

        if (nextUser) {
          initializeUser(nextUser);
          queryClient.setQueryData(["me"], { data: nextUser });
        }

        await queryClient.invalidateQueries({ queryKey: ["me"] });
        reset();
        navigate(getUserOnboardingReportPath(), { replace: true });
      },
      onError: (error) => {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || t("onboarding.dietRestrictions.error"),
        );
      },
    },
  });

  const handleToggle = (value) => {
    if (value === "none") {
      setField("dietRestrictions", ["none"]);
      return;
    }

    const filtered = filter(
      dietRestrictions,
      (restriction) => restriction !== "none",
    );

    if (includes(filtered, value)) {
      setField(
        "dietRestrictions",
        filter(filtered, (restriction) => restriction !== value),
      );
    } else {
      setField("dietRestrictions", [...filtered, value]);
    }
  };

  const isSelected = (value) => includes(dietRestrictions, value);
  const selectedRestrictions = filter(restrictions, (item) =>
    isSelected(item.value),
  );
  const hasSelection = selectedRestrictions.length > 0;
  const hasNoneSelected =
    selectedRestrictions.length === 1 &&
    selectedRestrictions[0]?.value === "none";
  const activeTone = getRestrictionTone(selectedRestrictions[0]?.value, goal);
  const heroImage = goalIllustrations[goal] ?? "/onboarding/curious.png";

  const handleComplete = async () => {
    const payload = {
      ...toUserOnboardingPayload({
        firstName: onboardingState.firstName,
        lastName: onboardingState.lastName,
        gender: onboardingState.gender,
        age: onboardingState.age,
        height: onboardingState.height,
        currentWeight: onboardingState.currentWeight,
        goal: onboardingState.goal,
        targetWeight: onboardingState.targetWeight,
        weeklyPace: onboardingState.weeklyPace,
        activityLevel: onboardingState.activityLevel,
        mealFrequency: onboardingState.mealFrequency,
        waterHabits: onboardingState.waterHabits,
        dietRestrictions,
      }),
      completed: true,
    };

    await completeOnboarding({
      url: "/user/onboarding/user",
      attributes: payload,
    });
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-all",
        hasSelection
          ? `bg-gradient-to-r ${activeTone.buttonTone}`
          : "bg-primary text-primary-foreground",
      )}
      size="lg"
      onClick={handleComplete}
      disabled={!hasSelection || isPending}
    >
      {isPending ? (
        <>
          <Loader2Icon className="mr-2 size-4 animate-spin" />
          {t("onboarding.dietRestrictions.saving")}
        </>
      ) : (
        t("onboarding.dietRestrictions.cta")
      )}
    </Button>,
  );

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden pt-3 md:pt-8  px-5">
      <PageAura tone={activeTone} />

      <div className="relative z-10 flex w-full flex-1 flex-col gap-5 md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={t("onboarding.dietRestrictions.question")}
        />

        <div className="relative mb-1 flex min-h-[180px] items-end justify-center overflow-hidden md:min-h-[260px]">
          <motion.div
            key={heroImage}
            className="flex h-full w-full items-end justify-center"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <img
              src={heroImage}
              alt="Diet preferences illustration"
              className="max-h-[220px] w-full max-w-[240px] object-contain md:max-h-[300px] md:max-w-[320px]"
            />
          </motion.div>

          <motion.div
            key={`diet-meta-${selectedRestrictions.map((item) => item.value).join("-") || "empty"}`}
            className={cn(
              "absolute bottom-0 max-w-[280px] rounded-[24px] border bg-background/85 px-4 py-3 text-center backdrop-blur md:max-w-[360px] md:rounded-[28px]",
              activeTone.border,
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
              Nutrition filters
            </p>
            <p className="text-base font-bold md:text-lg">
              {hasNoneSelected
                ? "No restrictions"
                : hasSelection
                  ? `${selectedRestrictions.length} preference${selectedRestrictions.length > 1 ? "s" : ""} selected`
                  : "Choose what to avoid"}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {map(selectedRestrictions.slice(0, 3), (item) => (
                <span
                  key={item.value}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold md:text-xs",
                    activeTone.badgeTone,
                  )}
                >
                  {t(`onboarding.dietRestrictions.${item.labelKey}`)}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-3 pb-1 md:grid-cols-2">
          {map(restrictions, (item) => {
            const isActive = isSelected(item.value);

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleToggle(item.value)}
                aria-pressed={isActive}
                className={cn(
                  "relative flex items-center gap-4 rounded-[24px] border p-4 text-left transition-all md:rounded-3xl",
                  isActive
                    ? `bg-gradient-to-br ${activeTone.cardTone} ${activeTone.border}`
                    : "border-border/70 bg-background/90 hover:border-primary/30",
                )}
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
                    isActive
                      ? activeTone.badgeTone
                      : "bg-muted text-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-5 text-foreground">
                    {t(`onboarding.dietRestrictions.${item.labelKey}`)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {t(`onboarding.dietRestrictions.${item.descriptionKey}`)}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isActive
                      ? `${activeTone.border} bg-background/70`
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <CheckIcon
                    className={cn(
                      "size-4 transition-all",
                      isActive ? activeTone.textTone : "text-transparent",
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
