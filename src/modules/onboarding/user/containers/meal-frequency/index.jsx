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

const options = [
  { value: "2", label: "2 meals", description: "Breakfast & dinner" },
  { value: "3", label: "3 meals", description: "Breakfast, lunch & dinner" },
  {
    value: "4",
    label: "4 meals",
    description: "3 main meals + 1 snack",
  },
  {
    value: "5",
    label: "5 meals",
    description: "3 main meals + 2 snacks",
  },
  {
    value: "6",
    label: "6+ meals",
    description: "Frequent small meals throughout the day",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { mealFrequency, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "meal-frequency");

  const handleSelect = (value) => {
    setField("mealFrequency", value);
  };

  const handleContinue = () => {
    if (mealFrequency) {
      navigate("/user/onboarding/water-habits");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!mealFrequency}
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="How often do you eat?" />

      <div className="flex flex-col gap-3 w-full">
        {map(options, (option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "flex items-center justify-between rounded-3xl border-1 p-5 text-left transition-colors",
              mealFrequency === option.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <div>
              <p className="font-bold text-lg">{option.label}</p>
              <p className="text-muted-foreground text-sm font-medium">
                {option.description}
              </p>
            </div>
            <div
              className={cn(
                "size-5 shrink-0 rounded-full border-2",
                mealFrequency === option.value
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
