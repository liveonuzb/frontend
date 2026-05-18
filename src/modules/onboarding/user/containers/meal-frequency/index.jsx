import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import OnboardingSelectCard from "../../components/onboarding-select-card.jsx";

import { find, map } from "lodash";

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

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mealFrequency, setField } = useOnboardingStore();
  const options = React.useMemo(() => getOptions(t), [t]);

  useOnboardingAutoSave("user", "meal-frequency");
  const selectedOption =
    find(options, (option) => option.value === mealFrequency) ?? options[1];
  const hasSelection = Boolean(mealFrequency);

  const handleSelect = (value) => {
    setField("mealFrequency", value);
  };

  const handleContinue = () => {
    if (hasSelection) {
      navigate("/user/onboarding/diet-requirements");
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
      {t("onboarding.next")} <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={selectedOption.tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col">
        <OnboardingQuestion question={t("onboarding.mealFrequency.question")} />

        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <div className="flex min-h-full flex-col justify-center gap-3 md:mx-auto md:max-w-2xl md:gap-4">
            {map(options, (option, index) => {
              const isActive = mealFrequency === option.value;

              return (
                <OnboardingSelectCard
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
