import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { WeightTicker } from "@/modules/onboarding/components/weight-ticker";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";
import BmiIdentifier from "../../components/bmi-identifier.jsx";
import {
  getOnboardingBmiMeta,
  getOnboardingIllustrationHeight,
  getOnboardingWeightIllustration,
} from "../../lib/illustration.js";

const Index = () => {
  const navigate = useNavigate();
  const {
    targetWeight,
    currentWeight,
    goal,
    setField,
    gender,
    age,
    height,
    firstName,
  } = useOnboardingStore();

  useOnboardingAutoSave("user", "target-weight");

  const currentVal = targetWeight?.value || currentWeight?.value || "70.0";
  const bmiMeta = getOnboardingBmiMeta(currentVal, height?.value);
  const illustration = getOnboardingWeightIllustration(
    gender,
    age,
    currentVal,
    height?.value,
  );
  const illustrationHeight = getOnboardingIllustrationHeight(height?.value);

  const diff = currentWeight?.value
    ? Math.abs(Number(currentVal) - Number(currentWeight.value)).toFixed(1)
    : null;

  const getMessage = () => {
    if (!currentVal || !currentWeight?.value) return null;
    const target = Number(currentVal);
    const current = Number(currentWeight.value);
    if (goal === "lose" && target < current) {
      return `Losing ${diff} kg is your next milestone.`;
    }
    if (goal === "gain" && target > current) {
      return `Gaining ${diff} kg is your next build phase.`;
    }
    if (goal === "maintain") {
      return "You are aiming to stay close to your current form.";
    }
    return null;
  };

  const handleContinue = () => {
    setField("targetWeight", { value: currentVal, unit: "kg" });
    navigate("/user/onboarding/weekly-pace");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "w-full border-transparent transition-all",
        bmiMeta ? `bg-gradient-to-r ${bmiMeta.buttonTone}` : "",
      )}
      size="lg"
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  const motivationalMessage = getMessage();

  return (
    <div className="relative flex h-full max-h-full w-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      {bmiMeta ? (
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            key={`target-weight-wash-${bmiMeta.key}`}
            className={cn(
              "absolute inset-0 bg-gradient-to-b opacity-80",
              bmiMeta.pageTint,
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          />
          <motion.div
            key={`target-weight-aura-top-${bmiMeta.key}`}
            className={cn(
              "absolute left-1/2 top-[12%] h-[28%] w-[74%] -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl",
              bmiMeta.pageTint,
            )}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.36, ease: "easeOut" }}
          />
          <motion.div
            key={`target-weight-aura-bottom-${bmiMeta.key}`}
            className={cn(
              "absolute inset-x-[10%] bottom-[-8%] h-[20%] rounded-full bg-gradient-to-t blur-3xl",
              bmiMeta.pageTint,
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.04 }}
          />
        </div>
      ) : null}

      <div className="relative z-10 flex h-full w-full flex-1 flex-col">
        <OnboardingQuestion
          question={
            firstName
              ? `${firstName} what's your target weight?`
              : "What's your target weight?"
          }
        />

        <BmiIdentifier
          meta={bmiMeta}
          heightValue={height?.value}
          title="Target BMI"
          note={motivationalMessage}
        />

        <div className="relative mt-2 flex flex-1 items-end justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={illustration.src}
              className="flex h-full items-end justify-center"
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
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

          <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2">
            <WeightTicker
              value={currentVal}
              onChange={(val) =>
                setField("targetWeight", { value: val, unit: "kg" })
              }
              accentColor={bmiMeta ? "var(--color-primary)" : undefined}
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
