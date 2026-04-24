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
import {
  getOnboardingHeightIllustration,
  getOnboardingIllustrationHeight,
} from "../../lib/illustration.js";
import { getHeightTone } from "../../lib/tones.js";

const getHeightProfile = (heightValue) => {
  const heightNumber = Number(heightValue);

  if (!Number.isFinite(heightNumber) || heightNumber < 160) {
    return {
      title: "Compact frame",
      note: "Targets will be calibrated to a shorter height profile.",
    };
  }

  if (heightNumber < 180) {
    return {
      title: "Balanced frame",
      note: "This sits around the center of our height planning range.",
    };
  }

  return {
    title: "Tall frame",
    note: "Energy and weight targets will scale for a taller body frame.",
  };
};

const Index = () => {
  const navigate = useNavigate();
  const { height, setField, gender, age, firstName } = useOnboardingStore();

  useOnboardingAutoSave("user", "height");

  const currentHeight = height?.value || "170";
  const illustration = getOnboardingHeightIllustration(
    gender,
    age,
    currentHeight,
  );
  const tone = getHeightTone(currentHeight);
  const profile = getHeightProfile(currentHeight);
  const illustrationHeight = getOnboardingIllustrationHeight(currentHeight);

  const handleContinue = () => {
    setField("height", { value: currentHeight, unit: "cm" });
    navigate("/user/onboarding/current-weight");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full max-h-full w-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />

      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto">
        <OnboardingQuestion
          question={
            firstName ? `${firstName} how tall are you?` : "How tall are you?"
          }
        />

        <motion.div
          className={cn(
            "mx-auto max-w-[200px] rounded-[24px] border bg-background/85 px-4 py-2 text-center backdrop-blur md:max-w-[240px]",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
            Height
          </p>
          <p className="mt-0.5 text-sm font-bold md:text-base">
            {profile.title}
          </p>
        </motion.div>

        <div className="relative mt-3 flex flex-1 items-end justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${illustration.src}-${currentHeight}`}
              className="flex h-full items-end justify-center"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <img
                src={illustration.src}
                alt={illustration.alt}
                className="max-h-full object-contain transition-all duration-300 md:max-w-[320px]"
                style={{ height: `${illustrationHeight * 0.9}px` }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Vertical ticker anchored to the right edge */}
          <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2">
            <WeightTicker
              value={currentHeight}
              onChange={(val) => setField("height", { value: val, unit: "cm" })}
              min={100}
              max={250}
              step={1}
              majorStep={10}
              labelStep={10}
              unit="cm"
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
