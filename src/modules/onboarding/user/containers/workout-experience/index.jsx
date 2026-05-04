import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRightIcon, DumbbellIcon } from "lucide-react";
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
const workoutExperiences = ["beginner", "intermediate", "advanced"];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workoutExperience = useOnboardingStore(
    (state) => state.workoutExperience,
  );
  const completedSteps = useOnboardingStore(
    (state) => state.completedUserOnboardingSteps,
  );
  const setFields = useOnboardingStore((state) => state.setFields);
  const shouldReduceMotion = useReducedMotion();
  const hasSelection = Boolean(workoutExperience);

  useOnboardingAutoSave("user", "workout-experience");

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedSteps ?? []), "workout-experience"]),
      ),
    });
  }, [completedSteps, setFields]);

  const goNext = React.useCallback(() => {
    if (!hasSelection) return;
    markCompleted();
    navigate("/user/onboarding/health-constraints");
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
          question={t("onboarding.lifestyle.workoutExperience")}
        />

        <div className="flex flex-col flex-1 justify-center gap-3 overflow-y-auto pb-5">
          {workoutExperiences.map((option) => {
            const active = workoutExperience === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setFields({ workoutExperience: option })}
                className={cn(
                  "flex min-h-[72px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:min-h-[84px]",
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
                >
                  <DumbbellIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {t(`onboarding.lifestyle.workoutExperiences.${option}`)}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t(
                      `onboarding.lifestyle.workoutExperienceDescriptions.${option}`,
                    )}
                  </span>
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
