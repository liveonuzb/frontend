import { map } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import useOnboardingBase from "@/hooks/app/use-onboarding-base";

const Index = () => {
  const navigate = useNavigate();
  const { activityLevel, setField } = useOnboardingStore();
  const base = useOnboardingBase();

  const levels = [
    {
      value: "sedentary",
      label: "Sedentary",
      title: "Low output",
      description: "Mostly sitting, very little training.",
      image: `${base}/slow.webp`,
      tone: ONBOARDING_ACCENTS.amber,
    },
    {
      value: "lightly-active",
      label: "Lightly active",
      title: "Easy routine",
      description: "Light movement one to three days a week.",
      image: `${base}/recommend.webp`,
      tone: ONBOARDING_ACCENTS.sky,
    },
    {
      value: "moderately-active",
      label: "Moderately active",
      title: "Balanced routine",
      description: "Steady training three to five days a week.",
      image: `${base}/focussed.webp`,
      tone: ONBOARDING_ACCENTS.green,
      recommended: true,
    },
    {
      value: "very-active",
      label: "Very active",
      title: "High output",
      description: "Hard sessions on most days of the week.",
      image: `${base}/aggressive.webp`,
      tone: ONBOARDING_ACCENTS.rose,
    },
  ];

  useOnboardingAutoSave("user", "activity-level");
  const selectedLevel =
    levels.find((level) => level.value === activityLevel) ?? levels[2];
  const hasSelection = Boolean(activityLevel);

  const handleSelect = (value) => {
    setField("activityLevel", value);
  };

  const handleContinue = () => {
    if (hasSelection) {
      navigate("/user/onboarding/meal-frequency");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-all",
        hasSelection
          ? `bg-gradient-to-r ${selectedLevel.tone.buttonTone}`
          : "bg-primary text-primary-foreground",
      )}
      size="lg"
      disabled={!hasSelection}
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden pt-3 md:pt-8  px-5">
      <PageAura tone={selectedLevel.tone} />

      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question="How active are you?" />

        <div className="relative mb-3 flex min-h-[140px] flex-1 items-end justify-center overflow-hidden md:mb-4 md:min-h-[260px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedLevel.image}
              className="flex h-full w-full items-end justify-center"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <img
                loading="lazy"
                src={selectedLevel.image}
                alt={selectedLevel.label}
                className="max-h-[170px] w-full max-w-[200px] object-contain md:max-h-[260px] md:max-w-[300px]"
              />
            </motion.div>
          </AnimatePresence>

          <motion.div
            key={`activity-meta-${selectedLevel.value}`}
            className={cn(
              "absolute bottom-0 rounded-[20px] border bg-background/85 px-3 py-1.5 text-center backdrop-blur md:rounded-[28px] md:px-4 md:py-3",
              selectedLevel.tone.border,
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
              Activity level
            </p>
            <p className="text-sm font-bold md:text-lg">
              {selectedLevel.title}
            </p>
            <p className="hidden text-xs text-muted-foreground md:block md:text-sm">
              {selectedLevel.description}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-2.5">
          {map(levels, (level) => {
            const isActive = activityLevel === level.value;

            return (
              <motion.button
                key={level.value}
                type="button"
                onClick={() => handleSelect(level.value)}
                className={cn(
                  "relative flex min-h-[78px] flex-col items-start gap-1.5 rounded-[20px] border px-2.5 py-2 text-left transition-all md:min-h-[158px] md:gap-4 md:rounded-3xl md:px-4 md:py-3",
                  isActive
                    ? `bg-gradient-to-br ${level.tone.cardTone} ${level.tone.border}`
                    : "border-border/70 bg-background/90 hover:border-primary/30",
                )}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  loading="lazy"
                  src={level.image}
                  alt={level.label}
                  className="size-8 rounded-xl object-cover md:size-16"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-bold leading-tight md:text-base">
                      {level.label}
                    </p>
                    {level.recommended ? (
                      <span
                        className={cn(
                          "hidden rounded-full px-1.5 py-0.5 text-[10px] font-semibold md:inline md:px-2 md:text-[11px]",
                          level.tone.badgeTone,
                        )}
                      >
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 hidden text-xs text-muted-foreground md:block md:text-sm">
                    {level.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "absolute right-2 top-2 flex size-4 items-center justify-center rounded-full border-2 md:right-3 md:top-3 md:size-6",
                    isActive
                      ? `${level.tone.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  <div
                    className={cn(
                      "size-2.5 rounded-full transition-all md:size-3",
                      isActive ? level.tone.dotTone : "scale-0 opacity-0",
                    )}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
