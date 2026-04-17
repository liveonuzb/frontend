import { map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { ChevronRight, GlassWaterIcon } from "lucide-react";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const options = [
  { value: "2", label: "1-2 glasses", description: "Less than 0.5L" },
  { value: "4", label: "3-4 glasses", description: "About 1L" },
  { value: "6", label: "5-6 glasses", description: "About 1.5L" },
  { value: "8", label: "7-8 glasses", description: "About 2L" },
  { value: "10", label: "9+ glasses", description: "More than 2L" },
];

const Index = () => {
  const navigate = useNavigate();
  const { waterHabits, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "water-habits");

  const handleSelect = (value) => {
    setField("waterHabits", value);
  };

  const handleContinue = () => {
    if (waterHabits) {
      navigate("/user/onboarding/diet-restrictions");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!waterHabits}
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="How much water do you drink?" />

      <div className="flex flex-col gap-3 w-full">
        {map(options, (option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "flex items-center gap-4 rounded-3xl border p-4 text-left transition-colors",
              waterHabits === option.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                waterHabits === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              <GlassWaterIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-lg">{option.label}</p>
              <p className="text-muted-foreground text-sm font-medium">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
