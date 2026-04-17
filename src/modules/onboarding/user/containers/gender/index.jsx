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

const genders = [
  { value: "male", label: "Male", emoji: "\u{1F468}" },
  { value: "female", label: "Female", emoji: "\u{1F469}" },
];

const Index = () => {
  const navigate = useNavigate();
  const { gender, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "gender");

  const handleSelect = (value) => {
    setField("gender", value);
  };

  const handleContinue = () => {
    if (gender) {
      navigate("/user/onboarding/age");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!gender}
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="What's your gender?" />

      <div className="grid grid-cols-2 gap-3 w-full">
        {map(genders, (item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleSelect(item.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-3xl border-2 p-6 transition-colors",
              gender === item.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <span className="text-4xl">{item.emoji}</span>
            <span className="text-base font-bold mt-2">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
