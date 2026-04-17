import { map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import CoachOptionCard from "@/modules/onboarding/components/coach-option-card.jsx";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const experienceOptions = [
  {
    value: "beginner",
    label: "1 yildan kam",
    description: "Yangi boshlayotgan yoki kam sonli mijozlar bilan ishlagan.",
  },
  {
    value: "intermediate",
    label: "1-3 yil",
    description: "Barqaror tajriba va amaliy coaching jarayonlari bor.",
  },
  {
    value: "advanced",
    label: "3-5 yil",
    description: "Natijador klientlar va shakllangan metodika mavjud.",
  },
  {
    value: "expert",
    label: "5+ yil",
    description: "Keng tajriba, ko'plab natijalar va chuqur ekspertiza.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { experience, setField } = useOnboardingStore();

  useOnboardingAutoSave("coach", "coach/experience");

  const handleNext = () => {
    navigate("/coach/onboarding/specialization");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!experience}
      onClick={handleNext}
    >
      Next {" >"}
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="Tajribangizni belgilang" />

      <div className="grid gap-3 w-full">
        {map(experienceOptions, (option) => (
          <CoachOptionCard
            key={option.value}
            selected={experience === option.value}
            onClick={() => setField("experience", option.value)}
            title={option.label}
            description={option.description}
            icon="⭐"
          />
        ))}
      </div>

      <div className="mt-8 flex items-start gap-3 p-4 bg-muted/30 rounded-3xl border border-border/50">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-background shrink-0 shadow-sm">
          <SparklesIcon className="size-5 text-primary" />
        </div>
        <div className="space-y-1 text-left">
          <div className="font-bold text-sm">
            Profilingiz darhol tayyor bo'ladi
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tajriba darajasi coach kabinetida va mijozlarga ko'rinadigan profile
            summaryda ishlatiladi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
