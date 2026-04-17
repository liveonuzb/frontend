import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { WeightPicker } from "@/modules/onboarding/components/weight-picker";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { targetWeight, currentWeight, goal, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "target-weight");

  const currentVal = targetWeight?.value || currentWeight?.value || "70.0";

  const diff = currentWeight.value
    ? Math.abs(Number(currentVal) - Number(currentWeight.value)).toFixed(1)
    : null;

  const getMessage = () => {
    if (!currentVal || !currentWeight.value) return null;
    const target = Number(currentVal);
    const current = Number(currentWeight.value);
    if (goal === "lose" && target < current) {
      return `You want to lose ${diff} kg. You've got this!`;
    }
    if (goal === "gain" && target > current) {
      return `You want to gain ${diff} kg. Let's build it!`;
    }
    if (goal === "maintain") {
      return "Great choice! Consistency is key.";
    }
    return null;
  };

  const handleContinue = () => {
    setField("targetWeight", { value: currentVal, unit: "kg" });
    navigate("/user/onboarding/weekly-pace");
  };

  useOnboardingFooter(
    <Button type="button" className="w-full" size="lg" onClick={handleContinue}>
      Next <ChevronRight />
    </Button>,
  );

  const motivationalMessage = getMessage();

  return (
    <div className="flex-1 flex flex-col justify-center items-center h-full pb-20">
      <OnboardingQuestion question="What's your target weight?" />

      <WeightPicker
        value={currentVal}
        onChange={(val) => setField("targetWeight", { value: val, unit: "kg" })}
      />

      {motivationalMessage && (
        <p className="text-center text-sm font-medium text-primary mt-6">
          {motivationalMessage}
        </p>
      )}
    </div>
  );
};

export default Index;
