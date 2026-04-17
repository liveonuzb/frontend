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

const ageItems = times(120 - 13 + 1, (i) => ({
  value: String(i + 13),
  label: String(i + 13),
}));

const Index = () => {
  const navigate = useNavigate();
  const { age, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "age");

  // If age is not set, default to 26
  const currentAge = age || "26";

  const handleContinue = () => {
    setField("age", currentAge);
    navigate("/user/onboarding/height");
  };

  useOnboardingFooter(
    <Button type="button" className="w-full" size="lg" onClick={handleContinue}>
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center items-center h-full pb-20">
      <OnboardingQuestion question="What's your age?" />

      <div className="flex justify-center w-full max-w-[200px]">
        <ScrollPicker
          items={ageItems}
          value={currentAge}
          onChange={(val) => setField("age", val)}
          itemHeight={56}
        />
      </div>
    </div>
  );
};

export default Index;
