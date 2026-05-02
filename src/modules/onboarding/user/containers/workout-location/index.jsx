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

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedSteps ?? []), "workout-location"]),
      ),
    });
  }, [completedSteps, setFields]);

  const goNext = React.useCallback(() => {
    markCompleted();
    navigate("/user/onboarding/workout-equipment");
  }, [markCompleted, navigate]);

  const handleSkip = React.useCallback(() => {
    setFields({ workoutLocation: "home" });
    markCompleted();
    navigate("/user/onboarding/workout-equipment");
  }, [markCompleted, navigate, setFields]);

  useOnboardingFooter(
    <div className="grid grid-cols-[0.42fr_1fr] gap-2">
      <Button type="button" variant="outline" className="h-12" onClick={handleSkip}>
        {t("onboarding.skip")}
      </Button>
      <Button
        type="button"
        className={cn("h-12 border-transparent bg-gradient-to-r", tone.buttonTone)}
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
        <OnboardingQuestion question={t("onboarding.workoutSteps.location.title")} />

        <motion.div
          className={cn(
            "mx-auto mb-3 w-full rounded-2xl border bg-background/90 px-3 py-3 backdrop-blur",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold">
            {t("onboarding.workoutSteps.location.description")}
          </p>
        </motion.div>

        <div className="grid flex-1 content-start gap-3 overflow-y-auto pb-5">
          {LOCATION_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = workoutLocation === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setFields({ workoutLocation: option.value })}
                className={cn(
                  "flex min-h-[76px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                  isActive
                    ? `bg-gradient-to-br ${tone.cardTone} ${tone.border}`
                    : "border-border/70 bg-background/90 hover:border-primary/30",
                )}
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                    isActive ? tone.badgeTone : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {t(`onboarding.workoutSteps.location.options.${option.value}.label`)}
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
