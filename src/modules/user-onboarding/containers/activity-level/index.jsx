import map from "lodash/map";
import find from "lodash/find";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import { useOnboardingAssets } from "@/hooks/app/use-onboarding-base";
import OnboardingOption from "./option.jsx";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activityLevel, setField } = useOnboardingStore();
  const { asset } = useOnboardingAssets();

  const levels = [
    {
      value: "sedentary",
      label: t("onboarding.activityLevel.sedentary"),
      title: t("onboarding.activityLevel.sedentaryTitle"),
      description: t("onboarding.activityLevel.sedentaryDescription"),
      image: asset("slow"),
      tone: ONBOARDING_ACCENTS.amber,
    },
    {
      value: "lightly-active",
      label: t("onboarding.activityLevel.lightlyActive"),
      title: t("onboarding.activityLevel.lightlyActiveTitle"),
      description: t("onboarding.activityLevel.lightlyActiveDescription"),
      image: asset("recommend"),
      tone: ONBOARDING_ACCENTS.sky,
    },
    {
      value: "moderately-active",
      label: t("onboarding.activityLevel.moderatelyActive"),
      title: t("onboarding.activityLevel.moderatelyActiveTitle"),
      description: t("onboarding.activityLevel.moderatelyActiveDescription"),
      image: asset("focussed"),
      tone: ONBOARDING_ACCENTS.green,
      recommended: true,
    },
    {
      value: "very-active",
      label: t("onboarding.activityLevel.veryActive"),
      title: t("onboarding.activityLevel.veryActiveTitle"),
      description: t("onboarding.activityLevel.veryActiveDescription"),
      image: asset("aggressive"),
      tone: ONBOARDING_ACCENTS.rose,
    },
  ];

  useOnboardingAutoSave("user", "activity-level");
  const selectedLevel =
    find(levels, (level) => level.value === activityLevel) ?? levels[2];
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
      {t("onboarding.next")} <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={selectedLevel.tone} />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.activityLevel.question")} />

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
              {t("onboarding.activityLevel.metaLabel")}
            </p>
            <p className="text-sm font-bold md:text-lg">
              {selectedLevel.title}
            </p>
            <p className="hidden text-xs text-muted-foreground md:block md:text-sm">
              {selectedLevel.description}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-2 pb-2 md:gap-2.5">
          {map(levels, (level) => {
            const isActive = activityLevel === level.value;

            return (
              <OnboardingOption
                key={level.value}
                active={isActive}
                description={level.description}
                imageAlt={level.label}
                imageUrl={level.image}
                onClick={() => handleSelect(level.value)}
                recommendedLabel={
                  level.recommended ? t("onboarding.recommended") : null
                }
                title={level.label}
                tone={level.tone}
                variant="image"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
