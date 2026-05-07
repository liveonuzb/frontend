import React from "react";
import { motion } from "framer-motion";
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
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={t("onboarding.workoutSteps.location.title")}
        />
        <div className="flex flex-col flex-1 justify-center gap-3 overflow-y-auto pb-5">
          {LOCATION_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = workoutLocation === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => handleSelectLocation(option.value)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                  isActive
                    ? `bg-gradient-to-br ${tone.cardTone} ${tone.border}`
                    : "border-border/70 bg-background/90 hover:border-primary/30",
                )}
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                    isActive
                      ? tone.badgeTone
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {t(
                      `onboarding.workoutSteps.location.options.${option.value}.label`,
                    )}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-muted-foreground">
                    {t(
                      `onboarding.workoutSteps.location.options.${option.value}.description`,
                    )}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
