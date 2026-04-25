import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { WeightTicker } from "@/modules/onboarding/components/weight-ticker";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import { getOnboardingPersonIllustration } from "../../lib/illustration.js";
import { getAgeTone } from "../../lib/tones.js";
import useOnboardingBase from "@/hooks/app/use-onboarding-base";

const getAgeProfile = (ageValue) => {
  const ageNumber = Number(ageValue);

  if (!Number.isFinite(ageNumber) || ageNumber <= 24) {
    return {
      title: "Young energy",
      note: "We can push a bit more on pace and recovery.",
    };
  }

  if (ageNumber >= 50) {
    return {
      title: "Mature rhythm",
      note: "Consistency and recovery will matter more.",
    };
  }

  return {
    title: "Balanced phase",
    note: "Your plan will blend progress with sustainable habits.",
  };
};

const Index = () => {
  const navigate = useNavigate();
  const { age, setField, gender, firstName } = useOnboardingStore();
  const base = useOnboardingBase();

  useOnboardingAutoSave("user", "age");

  const currentAge = age || "26";
  const illustration = getOnboardingPersonIllustration(gender, currentAge, base);
  const tone = getAgeTone(currentAge);
  const profile = getAgeProfile(currentAge);

  const handleContinue = () => {
    setField("age", currentAge);
    navigate("/user/onboarding/height");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      size="lg"
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full max-h-full w-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={
            firstName ? `${firstName} how old are you?` : "What's your age?"
          }
        />

        <motion.div
          className={cn(
            "mx-auto w-[220px] max-w-[220px] rounded-[24px] border bg-background/85 px-4 py-2 text-center backdrop-blur",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
            Age
          </p>
          <p className="mt-0.5 text-sm font-bold md:text-base">
            {profile.title}
          </p>
        </motion.div>

        <div className="relative mt-3 flex flex-1 items-end justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={illustration.src}
              className="flex h-full items-end justify-center"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <img loading="lazy"
                src={illustration.src}
                className="max-h-full w-full max-w-[320px] object-contain"
                alt={illustration.alt}
              />
            </motion.div>
          </AnimatePresence>

          {/* Vertical ticker anchored to the right edge */}
          <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2">
            <WeightTicker
              value={currentAge}
              onChange={(val) => setField("age", val)}
              min={13}
              max={120}
              step={1}
              majorStep={5}
              labelStep={10}
              unit="yrs"
              orientation="vertical"
              verticalHeight={240}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
