import { times } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

import { ScrollPicker } from "@/components/ui/scroll-picker";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { ChevronRight } from "lucide-react";

const heightItems = times(250 - 100 + 1, (i) => ({
  value: String(i + 100),
  label: String(i + 100),
}));

const Index = () => {
  const navigate = useNavigate();
  const { height, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "height");

  // "bo'y faqat sm da" -> fixed unit cm
  // Default to 170 if not set
  const currentHeight = height?.value || "170";

  const handleContinue = () => {
    setField("height", { value: currentHeight, unit: "cm" });
    navigate("/user/onboarding/current-weight");
  };

  useOnboardingFooter(
    <Button type="button" className="w-full" size="lg" onClick={handleContinue}>
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center items-center h-full pb-20">
      <OnboardingQuestion question="How tall are you?" />

      <div className="flex justify-center items-center w-full gap-4">
        <div className="w-24">
          <ScrollPicker
            items={heightItems}
            value={currentHeight}
            onChange={(val) => setField("height", { value: val, unit: "cm" })}
            itemHeight={56}
          />
        </div>
        <span className="text-2xl font-bold flex shrink-0">cm</span>
      </div>
    </div>
  );
};

export default Index;
