import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDaysIcon, ChevronRightIcon } from "lucide-react";
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
const workoutCounts = [0, 1, 2, 3, 4, 5, 6, 7];

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
  const shouldReduceMotion = useReducedMotion();
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

        <motion.div
          className={cn(
            "mx-auto mb-3 w-full rounded-2xl border bg-background/90 px-3 py-3 text-center backdrop-blur",
            tone.border,
          )}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        >
          <p className="text-sm font-semibold">
            {t("onboarding.lifestyle.weeklyWorkoutCountDescription")}
          </p>
        </motion.div>

        <div className="grid flex-1 content-start gap-2 overflow-y-auto pb-5">
          {workoutCounts.map((option) => {
            const active = String(weeklyWorkoutCount) === String(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setFields({ weeklyWorkoutCount: String(option) })
                }
                className={cn(
                  "flex min-h-[72px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:min-h-[84px]",
                  active
                    ? `bg-gradient-to-br ${tone.cardTone} ${tone.border}`
                    : "border-border/70 bg-background/90",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-2xl",
                    active ? tone.badgeTone : "bg-muted text-muted-foreground",
                  )}
                >
                  <CalendarDaysIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold">
                  {t("onboarding.lifestyle.weeklyWorkoutCountOption", {
                    count: option,
                  })}
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
