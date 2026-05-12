import React from "react";
import {
  ChevronRightIcon,
  DumbbellIcon,
  HomeIcon,
  MapPinIcon,
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
import OnboardingSelectCard from "../../components/onboarding-select-card.jsx";

const tone = ONBOARDING_ACCENTS.sky;

const LOCATION_OPTIONS = [
  { value: "home", icon: HomeIcon },
  { value: "gym", icon: DumbbellIcon },
  { value: "outdoor", icon: MapPinIcon },
];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workoutLocation = useOnboardingStore(
    (state) => state.workoutLocation || "home",
  );
  const completedSteps = useOnboardingStore(
    (state) => state.completedUserOnboardingSteps,
  );
  const setFields = useOnboardingStore((state) => state.setFields);

  useOnboardingAutoSave("user", "workout-location");

  const getCompletedSteps = React.useCallback(
    (...steps) => Array.from(new Set([...(completedSteps ?? []), ...steps])),
    [completedSteps],
  );

  const handleSelectLocation = React.useCallback(
    (value) => {
      const fields = { workoutLocation: value };

      if (value === "gym") {
        fields.equipmentIds = [];
        fields.customEquipment = [];
      } else {
        fields.completedUserOnboardingSteps = (completedSteps ?? []).filter(
          (step) => step !== "workout-equipment",
        );
      }

      setFields(fields);
    },
    [completedSteps, setFields],
  );

  const goNext = React.useCallback(() => {
    if (workoutLocation === "gym") {
      setFields({
        equipmentIds: [],
        customEquipment: [],
        completedUserOnboardingSteps: getCompletedSteps(
          "workout-location",
          "workout-equipment",
        ),
      });
      navigate("/user/onboarding/workout-body-parts");
      return;
    }

    setFields({
      completedUserOnboardingSteps: getCompletedSteps("workout-location"),
    });
    navigate("/user/onboarding/workout-equipment");
  }, [getCompletedSteps, navigate, setFields, workoutLocation]);

  const handleSkip = React.useCallback(() => {
    setFields({
      workoutLocation: "home",
      completedUserOnboardingSteps: getCompletedSteps("workout-location"),
    });
    navigate("/user/onboarding/workout-equipment");
  }, [getCompletedSteps, navigate, setFields]);

  useOnboardingFooter(
    <div className={"space-y-2"}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-12 w-full border-transparent"
        onClick={handleSkip}
      >
        {t("onboarding.skip")}
      </Button>
      <Button
        type="button"
        className={cn(
          "h-12 w-full border-transparent bg-gradient-to-r",
          tone.buttonTone,
        )}
        onClick={goNext}
      >
        {t("onboarding.next")}
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>,
  );

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={t("onboarding.workoutSteps.location.title")}
        />
        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <div className="flex min-h-full flex-col justify-center gap-3 md:mx-auto md:max-w-2xl md:gap-4">
            {LOCATION_OPTIONS.map((option) => {
              const isActive = workoutLocation === option.value;

              return (
                <OnboardingSelectCard
                  key={option.value}
                  active={isActive}
                  description={t(
                    `onboarding.workoutSteps.location.options.${option.value}.description`,
                  )}
                  icon={option.icon}
                  onClick={() => handleSelectLocation(option.value)}
                  title={t(
                    `onboarding.workoutSteps.location.options.${option.value}.label`,
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
