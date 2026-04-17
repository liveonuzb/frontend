import { filter, includes, isArray, join, map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore, useAuthStore } from "@/store";
import {
  BeefIcon,
  CheckCircle2Icon,
  CheckIcon,
  CircleSlashIcon,
  FlameIcon,
  LeafIcon,
  Loader2Icon,
  MilkOffIcon,
  SaladIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WheatOffIcon,
} from "lucide-react";
import { usePutQuery } from "@/hooks/api";
import {
  normalizeUserOnboarding,
  toUserOnboardingPayload,
} from "@/lib/user-onboarding";
import { toast } from "sonner";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

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

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const onboardingState = useOnboardingStore();
  const { dietRestrictions, reset, setField } = onboardingState;
  const { initializeUser, setOnboardingCompleted, user } = useAuthStore();
  const [isProcessing, setIsProcessing] = React.useState(false);

  useOnboardingAutoSave("user", "diet-restrictions");

  const { mutateAsync: completeOnboarding, isPending } = usePutQuery({
    mutationProps: {
      onSuccess: async (_data, variables) => {
        setIsProcessing(true);

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

        setTimeout(() => {
          navigate("/user", { replace: true });
        }, 2200);
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
      className="w-full"
      size="lg"
      onClick={handleComplete}
      disabled={!hasSelection || isPending || isProcessing}
    >
      {isPending || isProcessing ? (
        <>
          <Loader2Icon className="mr-2 size-4 animate-spin" />
          {t("onboarding.dietRestrictions.saving")}
        </>
      ) : (
        t("onboarding.dietRestrictions.cta")
      )}
    </Button>,
  );

  if (isProcessing) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-8">
        <div className="relative flex items-center justify-center">
          <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 animate-pulse">
            <CheckCircle2Icon className="size-12 text-primary" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">
            {t("onboarding.completion.title")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("onboarding.completion.description")}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          {t("onboarding.completion.redirecting")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex w-full flex-col gap-5">
        <OnboardingQuestion
          question={t("onboarding.dietRestrictions.question")}
        />

        <div className="space-y-3">
          <div className="flex flex-col gap-3">
            {map(restrictions, (item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleToggle(item.value)}
                aria-pressed={isSelected(item.value)}
                className={cn(
                  "relative flex items-center gap-4 rounded-2xl border p-3 text-left transition-all",
                  isSelected(item.value)
                    ? "border-primary bg-primary/8 shadow-[0_16px_36px_rgba(18,133,107,0.12)]"
                    : "border-border/70 bg-background hover:border-primary/35 hover:bg-primary/[0.03]",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors",
                    isSelected(item.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-5 text-foreground">
                    {t(`onboarding.dietRestrictions.${item.labelKey}`)}
                  </p>
                  <p className="text-sm leading-5 text-muted-foreground">
                    {t(`onboarding.dietRestrictions.${item.descriptionKey}`)}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isSelected(item.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <CheckIcon className="size-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
