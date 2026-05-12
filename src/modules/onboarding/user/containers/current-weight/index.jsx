import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
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
import PageAura from "../../components/page-aura.jsx";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentWeight, setField, gender, age, height, firstName } =
    useOnboardingStore();

  useOnboardingAutoSave("user", "current-weight");

  const currentVal = currentWeight?.value || "70.0";
  const bmiMeta = getOnboardingBmiMeta(currentVal, height?.value, t);
  const illustration = getOnboardingWeightIllustration(
    gender,
    age,
    currentVal,
    height?.value,
  );
  const illustrationHeight = getOnboardingIllustrationHeight(height?.value);

  const handleContinue = () => {
    setField("currentWeight", { value: currentVal, unit: "kg" });
    navigate("/user/onboarding/goal");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "w-full border-transparent transition-all h-12",
        bmiMeta ? `bg-gradient-to-r ${bmiMeta.buttonTone}` : "",
      )}
      size="lg"
      onClick={handleContinue}
    >
      {t("onboarding.next")} <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 max-h-full w-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8 pr-0">
      <PageAura tone={bmiMeta} />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col pb-1">
        <OnboardingQuestion
          question={
            firstName
              ? t("onboarding.currentWeight.questionWithName", {
                  name: firstName,
                })
              : t("onboarding.currentWeight.question")
          }
        />
        <div className={"pr-5"}>
          <BmiIdentifier
            meta={bmiMeta}
            heightValue={height?.value}
            title={t("onboarding.currentWeight.bmiTitle")}
            heightUnitLabel={t("onboarding.height.unit")}
          />
        </div>

        {/* Illustration fills the middle; vertical ticker pinned to the right */}
        <div className="relative mt-4 -mb-6 flex min-h-0 flex-1 items-end justify-center overflow-hidden md:mt-5">
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
                loading="lazy"
                src={illustration.src}
                alt={t("onboarding.illustrationAlt")}
                className="max-h-full object-contain transition-all duration-300 max-w-[280px] md:max-w-[320px]"
                style={{ height: `${illustrationHeight * 0.85}px` }}
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute right-0 top-[58%] z-20 -translate-y-1/2">
            <WeightTicker
              value={currentVal}
              onChange={(val) =>
                setField("currentWeight", { value: val, unit: "kg" })
              }
              ariaLabel={t("onboarding.currentWeight.bmiTitle")}
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
