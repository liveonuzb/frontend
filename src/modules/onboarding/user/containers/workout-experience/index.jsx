import React from "react";
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
import OnboardingSelectCard from "../../components/onboarding-select-card.jsx";

import { map } from "lodash";

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
    navigate("/user/onboarding/workout-location");
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
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={t("onboarding.lifestyle.workoutExperience")}
        />

        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <div className="flex min-h-full flex-col justify-center gap-3 md:mx-auto md:max-w-2xl md:gap-4">
            {map(workoutExperiences, (option) => {
              const active = workoutExperience === option;
              return (
                <OnboardingSelectCard
                  key={option}
                  active={active}
                  description={t(
                    `onboarding.lifestyle.workoutExperienceDescriptions.${option}`,
                  )}
                  icon={DumbbellIcon}
                  onClick={() => setFields({ workoutExperience: option })}
                  title={t(`onboarding.lifestyle.workoutExperiences.${option}`)}
                  tone={tone}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
