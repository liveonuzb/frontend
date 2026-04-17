import { map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";

const levels = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Little to no exercise, desk job",
  },
  {
    value: "lightly-active",
    label: "Lightly active",
    description: "Light exercise 1-3 days/week",
  },
  {
    value: "moderately-active",
    label: "Moderately active",
    description: "Moderate exercise 3-5 days/week",
  },
  {
    value: "very-active",
    label: "Very active",
    description: "Hard exercise 6-7 days/week",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { activityLevel, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "activity-level");

  const handleSelect = (value) => {
    setField("activityLevel", value);
  };

  const handleContinue = () => {
    if (activityLevel) {
      navigate("/user/onboarding/meal-frequency");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!activityLevel}
      onClick={handleContinue}
    >
      Next  <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="How active are you?" />

      <div className="flex flex-col gap-3 w-full">
        {map(levels, (level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => handleSelect(level.value)}
            className={cn(
              "flex items-center justify-between rounded-3xl border-1 p-5 text-left transition-colors",
              activityLevel === level.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <div>
              <p className="font-bold text-lg">{level.label}</p>
              <p className="text-muted-foreground text-sm font-medium">
                {level.description}
              </p>
            </div>
            <div
              className={cn(
                "size-5 shrink-0 rounded-full border-2 flex justify-center",
                activityLevel === level.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30",
              )}
            >
              <div className={'size-4 bg-background rounded-full'}/>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
