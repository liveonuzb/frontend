import { map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import {
  TrendingDownIcon,
  MinusIcon,
  TrendingUpIcon,
  ChevronRight,
} from "lucide-react";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const goals = [
  {
    value: "lose",
    label: "Lose weight",
    description: "Burn fat and get leaner",
    icon: TrendingDownIcon,
  },
  {
    value: "maintain",
    label: "Maintain weight",
    description: "Stay at my current weight",
    icon: MinusIcon,
  },
  {
    value: "gain",
    label: "Gain muscle",
    description: "Build strength and muscle mass",
    icon: TrendingUpIcon,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { goal, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "goal");

  const handleSelect = (value) => {
    setField("goal", value);
  };

  const handleContinue = () => {
    if (goal) {
      navigate("/user/onboarding/target-weight");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!goal}
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="What's your goal?" />

      <div className="flex flex-col gap-3 w-full">
        {map(goals, (item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleSelect(item.value)}
            className={cn(
              "flex items-center gap-4 rounded-3xl border p-4 text-left transition-colors",
              goal === item.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                goal === item.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-lg">{item.label}</p>
              <p className="text-muted-foreground text-sm font-medium">
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
