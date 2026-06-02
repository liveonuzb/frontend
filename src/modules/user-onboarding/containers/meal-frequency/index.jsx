import React from "react";
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
import OnboardingOption from "./option.jsx";
import { ONBOARDING_SCROLL_AREA_CLASS } from "../onboarding-scroll-area.js";

import find from "lodash/find";
import map from "lodash/map";

const getOptions = (t) => [
  {
    value: "2",
    label: t("onboarding.mealFrequency.options.2.label"),
    title: t("onboarding.mealFrequency.options.2.title"),
    description: t("onboarding.mealFrequency.options.2.description"),
    tone: ONBOARDING_ACCENTS.amber,
  },
  {
    value: "3",
    label: t("onboarding.mealFrequency.options.3.label"),
    title: t("onboarding.mealFrequency.options.3.title"),
    description: t("onboarding.mealFrequency.options.3.description"),
    tone: ONBOARDING_ACCENTS.green,
    recommended: true,
  },
  {
    value: "4",
    label: t("onboarding.mealFrequency.options.4.label"),
    title: t("onboarding.mealFrequency.options.4.title"),
    description: t("onboarding.mealFrequency.options.4.description"),
    tone: ONBOARDING_ACCENTS.sky,
  },
  {
    value: "5",
    label: t("onboarding.mealFrequency.options.5.label"),
    title: t("onboarding.mealFrequency.options.5.title"),
    description: t("onboarding.mealFrequency.options.5.description"),
    tone: ONBOARDING_ACCENTS.blue,
  },
];

const MealFrequencyFooter = ({ options }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mealFrequency = useOnboardingStore((state) => state.mealFrequency);
  const selectedOption =
    find(options, (option) => option.value === mealFrequency) ?? options[1];
  const hasSelection = Boolean(mealFrequency);

  const handleContinue = React.useCallback(() => {
    if (hasSelection) {
      navigate("/user/onboarding/diet-requirements");
    }
  }, [hasSelection, navigate]);

  return (
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
      {t("onboarding.next")} <ChevronRight />
    </Button>
  );
};

const Index = () => {
  const { t } = useTranslation();
  const mealFrequency = useOnboardingStore((state) => state.mealFrequency);
  const setField = useOnboardingStore((state) => state.setField);
  const options = React.useMemo(() => getOptions(t), [t]);

  useOnboardingAutoSave("user", "meal-frequency");
  const selectedOption =
    find(options, (option) => option.value === mealFrequency) ?? options[1];

  const handleSelect = (value) => {
    setField("mealFrequency", value);
  };

  useOnboardingFooter(<MealFrequencyFooter options={options} />);

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={selectedOption.tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col">
        <OnboardingQuestion question={t("onboarding.mealFrequency.question")} />

        <div className={cn(ONBOARDING_SCROLL_AREA_CLASS, "py-4")}>
          <div className="flex min-h-full flex-col justify-center gap-3 md:mx-auto md:max-w-2xl md:gap-4">
            {map(options, (option, index) => {
              const isActive = mealFrequency === option.value;

              return (
                <OnboardingOption
                  key={option.value}
                  active={isActive}
                  badge={option.label}
                  description={option.description}
                  onClick={() => handleSelect(option.value)}
                  recommendedLabel={
                    option.recommended ? t("onboarding.recommended") : null
                  }
                  title={option.title}
                  tone={option.tone}
                  transitionDelay={index * 0.04}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
