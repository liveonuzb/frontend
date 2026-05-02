import { map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import CoachOptionCard from "@/modules/onboarding/components/coach-option-card.jsx";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const getExperienceOptions = (t) => [
  {
    value: "beginner",
    label: t("onboarding.coach.experience.options.beginner.label"),
    description: t("onboarding.coach.experience.options.beginner.description"),
  },
  {
    value: "intermediate",
    label: t("onboarding.coach.experience.options.intermediate.label"),
    description: t(
      "onboarding.coach.experience.options.intermediate.description",
    ),
  },
  {
    value: "advanced",
    label: t("onboarding.coach.experience.options.advanced.label"),
    description: t("onboarding.coach.experience.options.advanced.description"),
  },
  {
    value: "expert",
    label: t("onboarding.coach.experience.options.expert.label"),
    description: t("onboarding.coach.experience.options.expert.description"),
  },
];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { experience, setField } = useOnboardingStore();
  const experienceOptions = React.useMemo(() => getExperienceOptions(t), [t]);

  useOnboardingAutoSave("coach", "coach/experience");

  const handleNext = () => {
    navigate("/coach/onboarding/specialization");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!experience}
      onClick={handleNext}
    >
      {t("onboarding.next")}
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question={t("onboarding.coach.experience.question")} />

      <div className="grid gap-3 w-full">
        {map(experienceOptions, (option) => (
          <CoachOptionCard
            key={option.value}
            selected={experience === option.value}
            onClick={() => setField("experience", option.value)}
            title={option.label}
            description={option.description}
            icon="⭐"
          />
        ))}
      </div>

      <div className="mt-8 flex items-start gap-3 p-4 bg-muted/30 rounded-3xl border border-border/50">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-background shrink-0 shadow-sm">
          <SparklesIcon className="size-5 text-primary" />
        </div>
        <div className="space-y-1 text-left">
          <div className="font-bold text-sm">
            {t("onboarding.coach.experience.infoTitle")}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("onboarding.coach.experience.infoDescription")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
