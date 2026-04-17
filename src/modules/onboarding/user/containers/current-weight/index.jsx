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
  const { currentWeight, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "current-weight");


  const currentVal = currentWeight?.value || "70.0";

  const handleContinue = () => {
    setField("currentWeight", { value: currentVal, unit: "kg" });
    navigate("/user/onboarding/goal");
  };

  useOnboardingFooter(
    <Button type="button" className="w-full" size="lg" onClick={handleContinue}>
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center items-center h-full pb-20">
      <OnboardingQuestion question="What's your current weight?" />

      <WeightPicker
        value={currentVal}
        onChange={(val) => setField("currentWeight", { value: val, unit: "kg" })}
      />
    </div>
  );
};

export default Index;
