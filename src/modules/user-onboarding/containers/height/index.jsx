import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { WeightTicker } from "@/modules/user-onboarding/components/weight-ticker";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import {
  ONBOARDING_NUMERIC_PICKER_BODY_CLASS,
  ONBOARDING_NUMERIC_PICKER_PAGE_CLASS,
  ONBOARDING_NUMERIC_PICKER_STAGE_CLASS,
  ONBOARDING_NUMERIC_PICKER_TICKER_CLASS,
} from "../numeric-picker-layout.js";
import {
  getOnboardingIllustrationHeight,
  getOnboardingPersonIllustration,
} from "../../lib/illustration.js";
import { getHeightTone } from "../../lib/tones.js";
import { useOnboardingAssets } from "@/hooks/app/use-onboarding-base";

import toNumber from "lodash/toNumber";

const getHeightProfile = (heightValue, t) => {
  const heightNumber = toNumber(heightValue);

  if (!Number.isFinite(heightNumber) || heightNumber < 160) {
    return {
      title: t("onboarding.height.profiles.compact.title"),
      note: t("onboarding.height.profiles.compact.note"),
    };
  }

  if (heightNumber < 180) {
    return {
      title: t("onboarding.height.profiles.balanced.title"),
      note: t("onboarding.height.profiles.balanced.note"),
    };
  }

  return {
    title: t("onboarding.height.profiles.tall.title"),
    note: t("onboarding.height.profiles.tall.note"),
  };
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { height, setField, gender, age, firstName } = useOnboardingStore();
  const { base, extension } = useOnboardingAssets();

  useOnboardingAutoSave("user", "height");

  const currentHeight = height?.value || "170";
  const illustration = getOnboardingPersonIllustration(
    gender,
    age,
    base,
    extension,
  );
  const tone = getHeightTone(currentHeight);
  const profile = getHeightProfile(currentHeight, t);
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
      {t("onboarding.next")} <ChevronRight />
    </Button>,
  );

  return (
    <div className={cn(ONBOARDING_NUMERIC_PICKER_PAGE_CLASS)}>
      <PageAura tone={tone} />

      <div
        className={cn(
          ONBOARDING_NUMERIC_PICKER_BODY_CLASS,
          "md:mx-auto md:max-w-4xl",
        )}
      >
        <OnboardingQuestion
          description={profile.note}
          question={
            firstName
              ? t("onboarding.height.questionWithName", { name: firstName })
              : t("onboarding.height.question")
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
            {t("onboarding.height.metaLabel")}
          </p>
          <p className="mt-0.5 text-sm font-bold md:text-base">
            {profile.title}
          </p>
        </motion.div>

        <div
          className={cn(ONBOARDING_NUMERIC_PICKER_STAGE_CLASS, "mt-2 md:mt-3")}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={illustration.src}
              className="flex h-full items-end justify-center"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <img
                loading="lazy"
                src={illustration.src}
                alt={t("onboarding.illustrationAlt")}
                className="max-h-full object-contain transition-all duration-300 max-w-[240px] md:max-w-[300px]"
                style={{ height: `${illustrationHeight * 0.9}px` }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Vertical ticker anchored to the right edge */}
          <div className={ONBOARDING_NUMERIC_PICKER_TICKER_CLASS}>
            <WeightTicker
              value={currentHeight}
              onChange={(val) => setField("height", { value: val, unit: "cm" })}
              min={100}
              max={250}
              step={1}
              majorStep={10}
              labelStep={10}
              unit="cm"
              ariaLabel={t("onboarding.height.metaLabel")}
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
