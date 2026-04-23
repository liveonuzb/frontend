import { times } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ScrollPicker } from "@/components/ui/scroll-picker";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import {
  getOnboardingHeightIllustration,
  getOnboardingIllustrationHeight,
} from "../../lib/illustration.js";
import { getHeightTone } from "../../lib/tones.js";

const heightItems = times(250 - 100 + 1, (i) => ({
  value: String(i + 100),
  label: String(i + 100),
}));

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
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden pt-3 md:pt-8  px-5">
      <PageAura tone={tone} />

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={
            firstName ? `${firstName} how tall are you?` : "How tall are you?"
          }
        />

        <div className="flex w-full items-end justify-center gap-4 md:gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${illustration.src}-${currentHeight}`}
              className="flex min-h-[260px] flex-1 items-end justify-end md:min-h-[420px]"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <img
                src={illustration.src}
                alt={illustration.alt}
                className="object-contain transition-all duration-300 md:max-w-[320px]"
                style={{ height: `${illustrationHeight * 0.9}px` }}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex shrink-0 flex-col items-center gap-3">
            <motion.div
              key={`height-profile-${currentHeight}`}
              className={cn(
                "max-w-[190px] rounded-[24px] border bg-background/85 px-4 py-3 text-center backdrop-blur md:max-w-[240px]",
                tone.border,
              )}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
                Height
              </p>
              <p className="mt-1 text-base font-bold md:text-lg">
                {profile.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                {currentHeight} cm
              </p>
            </motion.div>

            <div
              className={cn(
                "flex items-center gap-2 rounded-[30px] border bg-background/80 px-2 py-2 backdrop-blur",
                tone.border,
              )}
            >
              <div className="w-20">
                <ScrollPicker
                  items={heightItems}
                  value={currentHeight}
                  onChange={(val) =>
                    setField("height", { value: val, unit: "cm" })
                  }
                  itemHeight={56}
                />
              </div>
              <span className="pr-2 text-xl font-bold text-muted-foreground">
                cm
              </span>
            </div>

            <p className="max-w-[190px] text-center text-xs text-muted-foreground md:max-w-[240px] md:text-sm">
              {profile.note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
