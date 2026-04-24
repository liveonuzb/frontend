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
import { getOnboardingTierIllustration } from "../../lib/illustration.js";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const options = [
  {
    value: "2",
    label: "2 meals",
    title: "Light structure",
    description: "Breakfast and dinner.",
    tier: 1,
    tone: ONBOARDING_ACCENTS.amber,
  },
  {
    value: "3",
    label: "3 meals",
    title: "Classic rhythm",
    description: "Breakfast, lunch and dinner.",
    tier: 2,
    tone: ONBOARDING_ACCENTS.green,
    recommended: true,
  },
  {
    value: "4",
    label: "4 meals",
    title: "Steady fuel",
    description: "Three meals and one snack.",
    tier: 3,
    tone: ONBOARDING_ACCENTS.sky,
  },
  {
    value: "5",
    label: "5 meals",
    title: "Frequent fuel",
    description: "Three meals and two snacks.",
    tier: 4,
    tone: ONBOARDING_ACCENTS.blue,
  },
  {
    value: "6",
    label: "6+ meals",
    title: "High frequency",
    description: "Many smaller meals during the day.",
    tier: 5,
    tone: ONBOARDING_ACCENTS.pink,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { mealFrequency, setField, gender, age } = useOnboardingStore();

  useOnboardingAutoSave("user", "meal-frequency");
  const selectedOption =
    options.find((option) => option.value === mealFrequency) ?? options[1];
  const illustration = getOnboardingTierIllustration(
    gender,
    age,
    selectedOption.tier,
  );
  const hasSelection = Boolean(mealFrequency);

  const handleSelect = (value) => {
    setField("mealFrequency", value);
  };

  const handleContinue = () => {
    if (hasSelection) {
      navigate("/user/onboarding/water-habits");
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
        <OnboardingQuestion question="How often do you eat?" />

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
              <img loading="lazy"
                src={illustration.src}
                alt={selectedOption.label}
                className="max-h-[220px] w-full max-w-[230px] object-contain md:max-h-[290px] md:max-w-[320px]"
              />
            </motion.div>
          </AnimatePresence>

          <motion.div
            key={`meal-meta-${selectedOption.value}`}
            className={cn(
              "absolute bottom-0 rounded-[24px] border bg-background/85 px-4 py-3 text-center backdrop-blur md:rounded-[28px]",
              selectedOption.tone.border,
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
              Meal rhythm
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
            const isActive = mealFrequency === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "relative flex min-h-[112px] flex-col items-start gap-2 rounded-[24px] border px-3 py-3 text-left transition-all md:min-h-[148px] md:gap-4 md:rounded-3xl md:px-4",
                  option.value === "6" && "col-span-2",
                  isActive
                    ? `bg-gradient-to-br ${option.tone.cardTone} ${option.tone.border}`
                    : "border-border/70 bg-background/90 hover:border-primary/30",
                )}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold md:text-sm",
                      option.tone.badgeTone,
                    )}
                  >
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
