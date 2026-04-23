import { map } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { ChevronRight, GlassWaterIcon } from "lucide-react";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import PageAura from "../../components/page-aura.jsx";
import { getOnboardingTierIllustration } from "../../lib/illustration.js";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const options = [
  {
    value: "2",
    label: "1-2 glasses",
    title: "Needs a lift",
    description: "Usually under 0.5L a day.",
    tier: 1,
    tone: ONBOARDING_ACCENTS.amber,
  },
  {
    value: "4",
    label: "3-4 glasses",
    title: "Building up",
    description: "Roughly around 1L a day.",
    tier: 2,
    tone: ONBOARDING_ACCENTS.sky,
  },
  {
    value: "6",
    label: "5-6 glasses",
    title: "Balanced hydration",
    description: "Around 1.5L most days.",
    tier: 3,
    tone: ONBOARDING_ACCENTS.green,
    recommended: true,
  },
  {
    value: "8",
    label: "7-8 glasses",
    title: "Strong habit",
    description: "About 2L during the day.",
    tier: 4,
    tone: ONBOARDING_ACCENTS.blue,
  },
  {
    value: "10",
    label: "9+ glasses",
    title: "High hydration",
    description: "More than 2L every day.",
    tier: 5,
    tone: ONBOARDING_ACCENTS.rose,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { waterHabits, setField, gender, age } = useOnboardingStore();

  useOnboardingAutoSave("user", "water-habits");
  const selectedOption =
    options.find((option) => option.value === waterHabits) ?? options[2];
  const illustration = getOnboardingTierIllustration(
    gender,
    age,
    selectedOption.tier,
  );
  const hasSelection = Boolean(waterHabits);

  const handleSelect = (value) => {
    setField("waterHabits", value);
  };

  const handleContinue = () => {
    if (hasSelection) {
      navigate("/user/onboarding/diet-restrictions");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-all",
        hasSelection
          ? `bg-gradient-to-r ${selectedOption.tone.buttonTone}`
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
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden pt-3 md:pt-8  px-5">
      <PageAura tone={selectedOption.tone} />

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question="How much water do you drink?" />

        <div className="relative mb-4 flex min-h-[190px] items-end justify-center overflow-hidden md:min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={illustration.src}
              className="flex h-full w-full items-end justify-center"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <img
                src={illustration.src}
                alt={selectedOption.label}
                className="max-h-[220px] w-full max-w-[230px] object-contain md:max-h-[290px] md:max-w-[320px]"
              />
            </motion.div>
          </AnimatePresence>

          <motion.div
            key={`water-meta-${selectedOption.value}`}
            className={cn(
              "absolute bottom-0 rounded-[24px] border bg-background/85 px-4 py-3 text-center backdrop-blur md:rounded-[28px]",
              selectedOption.tone.border,
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
              Hydration habit
            </p>
            <p className="text-base font-bold md:text-lg">
              {selectedOption.title}
            </p>
            <p className="text-xs text-muted-foreground md:text-sm">
              {selectedOption.description}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {map(options, (option) => {
            const isActive = waterHabits === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "relative flex min-h-[112px] flex-col items-start gap-2 rounded-[24px] border px-3 py-3 text-left transition-all md:min-h-[148px] md:gap-4 md:rounded-3xl md:px-4",
                  option.value === "10" && "col-span-2",
                  isActive
                    ? `bg-gradient-to-br ${option.tone.cardTone} ${option.tone.border}`
                    : "border-border/70 bg-background/90 hover:border-primary/30",
                )}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full md:size-10",
                      option.tone.badgeTone,
                    )}
                  >
                    <GlassWaterIcon className="size-4 md:size-5" />
                  </div>
                  <span className="text-sm font-bold md:text-base">
                    {option.label}
                  </span>
                  {option.recommended ? (
                    <span className="rounded-full border border-border/60 bg-background/75 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                      Recommended
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold md:text-base">
                    {option.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                    {option.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 md:size-6",
                    isActive
                      ? `${option.tone.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  <div
                    className={cn(
                      "size-3 rounded-full transition-all",
                      isActive ? option.tone.dotTone : "scale-0 opacity-0",
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
