import React from "react";
import {
  ActivityIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleOffIcon,
  FlameIcon,
  TrophyIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const tone = ONBOARDING_ACCENTS.green;
const workoutCountOptions = [
  { value: "0", key: "none", icon: CircleOffIcon },
  { value: "2", key: "light", icon: CalendarDaysIcon },
  { value: "4", key: "balanced", icon: ActivityIcon },
  { value: "6", key: "active", icon: FlameIcon },
  { value: "7", key: "daily", icon: TrophyIcon },
];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const weeklyWorkoutCount = useOnboardingStore(
    (state) => state.weeklyWorkoutCount,
  );
  const completedSteps = useOnboardingStore(
    (state) => state.completedUserOnboardingSteps,
  );
  const setFields = useOnboardingStore((state) => state.setFields);
  const hasSelection =
    weeklyWorkoutCount !== "" &&
    weeklyWorkoutCount !== null &&
    weeklyWorkoutCount !== undefined;

  useOnboardingAutoSave("user", "weekly-workout-count");

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedSteps ?? []), "weekly-workout-count"]),
      ),
    });
  }, [completedSteps, setFields]);

  const goNext = React.useCallback(() => {
    if (!hasSelection) return;
    markCompleted();
    navigate("/user/onboarding/workout-experience");
  }, [hasSelection, markCompleted, navigate]);

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-colors",
        hasSelection ? `bg-gradient-to-r ${tone.buttonTone}` : "",
      )}
      size="lg"
      disabled={!hasSelection}
      onClick={goNext}
    >
      {t("onboarding.next")}
      <ChevronRightIcon className="size-4" aria-hidden="true" />
    </Button>,
  );

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={t("onboarding.lifestyle.weeklyWorkoutCount")}
        />
        <div className="grid flex-1 content-start gap-2 overflow-y-auto pb-5">
          {workoutCountOptions.map((option) => {
            const active = String(weeklyWorkoutCount) === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFields({ weeklyWorkoutCount: option.value })}
                className={cn(
                  "flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:min-h-[84px] md:px-4",
                  active
                    ? `bg-gradient-to-br ${tone.cardTone} ${tone.border}`
                    : "border-border/70 bg-background/90",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                    active ? tone.badgeTone : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-bold leading-snug">
                    {t(
                      `onboarding.lifestyle.weeklyWorkoutCountOptions.${option.key}.title`,
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {t(
                      `onboarding.lifestyle.weeklyWorkoutCountOptions.${option.key}.description`,
                    )}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    active
                      ? `${tone.border} bg-background/70`
                      : "border-border bg-background",
                  )}
                  aria-hidden="true"
                >
                  <CheckIcon
                    className={cn(
                      "size-4",
                      active ? tone.textTone : "text-transparent",
                    )}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
