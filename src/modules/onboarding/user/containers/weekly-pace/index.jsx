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

const paces = [
  { value: 0.25, label: "0.25", description: "Slow & steady" },
  { value: 0.5, label: "0.5", description: "Recommended" },
  { value: 0.75, label: "0.75", description: "Moderate" },
  { value: 1, label: "1.0", description: "Aggressive" },
];

const Index = () => {
  const navigate = useNavigate();
  const { weeklyPace, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "weekly-pace");

  const handleSelect = (value) => {
    setField("weeklyPace", value);
  };

  const handleContinue = () => {
    navigate("/user/onboarding/activity-level");
  };

  useOnboardingFooter(
    <Button type="button" className="w-full" size="lg" onClick={handleContinue}>
      Next  <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="Set your weekly pace" />

      <div className="flex flex-col gap-3 w-full">
        {map(paces, (pace) => (
          <button
            key={pace.value}
            type="button"
            onClick={() => handleSelect(pace.value)}
            className={cn(
              "flex items-center justify-between rounded-3xl border p-5 text-left transition-colors",
              weeklyPace === pace.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <div>
              <p className="font-bold text-lg">{pace.label} kg/week</p>
              <p className="text-muted-foreground text-sm font-medium">
                {pace.description}
              </p>
            </div>
            <div
              className={cn(
                "h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                weeklyPace === pace.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30",
              )}
            >
              <div className={'size-4 bg-background rounded-full'} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
