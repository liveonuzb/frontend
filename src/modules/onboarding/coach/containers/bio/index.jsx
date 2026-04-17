import React from "react";
import { useNavigate } from "react-router";
import { FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { cn } from "@/lib/utils.js";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const Index = () => {
  const navigate = useNavigate();
  const { coachBio, setField } = useOnboardingStore();

  useOnboardingAutoSave("coach", "coach/bio");

  const bioLength = String(coachBio ?? "").trim().length;
  const isBioValid = bioLength >= 10;

  const handleNext = () => {
    navigate("/coach/onboarding/pricing");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      onClick={handleNext}
    >
      {isBioValid ? "Davom etish" : "O'tkazib yuborish"}
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="Coach bio yozing" />

      <div className="space-y-6 w-full">
        <Field>
          <FieldLabel>Bio</FieldLabel>
          <Textarea
            placeholder="Men sog'lom ovqatlanish va vazn boshqaruvi bo'yicha murabbiyman. Mijozlarimga reja, nazorat va kundalik odatlarni shakllantirishda yordam beraman."
            rows={8}
            value={coachBio}
            onChange={(event) => setField("coachBio", event.target.value)}
          />
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
            <span>Kamida 10 ta belgi kiriting.</span>
            <span className={cn(isBioValid ? "text-primary" : "")}>
              {bioLength}/500
            </span>
          </div>
        </Field>

        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-3xl border border-border/50">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-background shrink-0 shadow-sm">
            <FileTextIcon className="size-5 text-primary" />
          </div>
          <div className="space-y-1 text-left">
            <div className="font-bold text-sm">
              Qisqa, aniq va ishonchli yozing
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tajriba, asosiy yo&apos;nalish va clientlarga bera oladigan
              natijangizni 2-3 gapda yozish kifoya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
