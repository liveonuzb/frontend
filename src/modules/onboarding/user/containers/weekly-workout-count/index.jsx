import React from "react";
import {
  ActivityIcon,
  CalendarDaysIcon,
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
import { isNoWorkoutPlan } from "@/modules/onboarding/lib/onboarding-validation";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import OnboardingSelectCard from "../../components/onboarding-select-card.jsx";

import { map } from "lodash";

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
    if (isNoWorkoutPlan(weeklyWorkoutCount)) {
      setFields({
        workoutExperience: "",
        workoutLocation: "",
        equipmentIds: [],
        customEquipment: [],
        workoutBodyPartIds: [],
        customWorkoutBodyParts: [],
      });
      navigate("/user/onboarding/review", {
        state: { returnTo: "/user/onboarding/weekly-workout-count" },
      });
      return;
    }
    navigate("/user/onboarding/workout-experience");
  }, [hasSelection, markCompleted, navigate, setFields, weeklyWorkoutCount]);

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
          question={t("onboarding.lifestyle.weeklyWorkoutCount")}
        />
        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <div className="flex min-h-full flex-col justify-center gap-3 md:mx-auto md:max-w-2xl md:gap-4">
            {map(workoutCountOptions, (option) => {
              const active = String(weeklyWorkoutCount) === option.value;

              return (
                <OnboardingSelectCard
                  key={option.value}
                  active={active}
                  description={t(
                    `onboarding.lifestyle.weeklyWorkoutCountOptions.${option.key}.description`,
                  )}
                  icon={option.icon}
                  onClick={() => {
                    const noWorkout = isNoWorkoutPlan(option.value);
                    setFields({
                      weeklyWorkoutCount: option.value,
                      ...(noWorkout
                        ? {
                            workoutExperience: "",
                            workoutLocation: "",
                            equipmentIds: [],
                            customEquipment: [],
                            workoutBodyPartIds: [],
                            customWorkoutBodyParts: [],
                          }
                        : {
                            workoutLocation: "home",
                          }),
                    });
                  }}
                  title={t(
                    `onboarding.lifestyle.weeklyWorkoutCountOptions.${option.key}.title`,
                  )}
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
