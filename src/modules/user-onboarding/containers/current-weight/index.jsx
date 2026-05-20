import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { WeightTicker } from "@/modules/user-onboarding/components/weight-ticker";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";
import BmiIdentifier from "../../components/bmi-identifier.jsx";
import {
  getOnboardingBmiMeta,
  getOnboardingIllustrationHeight,
  getOnboardingWeightIllustration,
} from "../../lib/illustration.js";
import PageAura from "../../components/page-aura.jsx";
import {
  ONBOARDING_NUMERIC_PICKER_BODY_CLASS,
  ONBOARDING_NUMERIC_PICKER_PAGE_CLASS,
  ONBOARDING_NUMERIC_PICKER_STAGE_CLASS,
  ONBOARDING_NUMERIC_PICKER_TICKER_CLASS,
} from "../numeric-picker-layout.js";
import { useOnboardingAssets } from "@/hooks/app/use-onboarding-base";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentWeight, setField, gender, age, height, firstName } =
    useOnboardingStore();
  const { base, extension } = useOnboardingAssets();

  useOnboardingAutoSave("user", "current-weight");

  const currentVal = currentWeight?.value || "70.0";
  const bmiMeta = getOnboardingBmiMeta(currentVal, height?.value, t);
  const illustration = getOnboardingWeightIllustration(
    gender,
    age,
    currentVal,
    height?.value,
    base,
    extension,
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
    <div className={cn(ONBOARDING_NUMERIC_PICKER_PAGE_CLASS)}>
      <PageAura tone={bmiMeta} />

      <div className={cn(ONBOARDING_NUMERIC_PICKER_BODY_CLASS)}>
        <OnboardingQuestion
          description={bmiMeta?.description}
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
        <div
          className={cn(ONBOARDING_NUMERIC_PICKER_STAGE_CLASS, "mt-4 md:mt-5")}
        >
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
          <div className={ONBOARDING_NUMERIC_PICKER_TICKER_CLASS}>
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
