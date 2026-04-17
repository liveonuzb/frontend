import { map, includes, filter, isArray } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { cn } from "@/lib/utils";

const TARGET_AUDIENCES = [
  { value: "children", label: "Bolalar (6-12 yosh)", emoji: "\uD83D\uDC76" },
  { value: "teenagers", label: "O'smirlar (13-17 yosh)", emoji: "\uD83E\uDDD1" },
  { value: "beginners", label: "Boshlang'ich", emoji: "\uD83C\uDF31" },
  { value: "intermediate", label: "O'rta daraja", emoji: "\uD83D\uDCC8" },
  { value: "advanced", label: "Ilg'or/Professional", emoji: "\uD83C\uDFC6" },
  { value: "seniors", label: "Kattalar (60+)", emoji: "\uD83E\uDDD3" },
];

const Index = () => {
  const navigate = useNavigate();
  const { targetAudience, setField } = useOnboardingStore();

  useOnboardingAutoSave("coach", "coach/target-audience");

  const selected = isArray(targetAudience) ? targetAudience : [];

  const handleToggle = (value) => {
    const exists = includes(selected, value);
    const next = exists
      ? filter(selected, (v) => v !== value)
      : [...selected, value];
    setField("targetAudience", next);
  };

  const handleNext = () => {
    navigate("/coach/onboarding/availability");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={selected.length === 0}
      onClick={handleNext}
    >
      Davom etish
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="Qaysi auditoriyaga xizmat ko'rsatasiz?" />

      <div className="grid gap-3 w-full">
        {map(TARGET_AUDIENCES, (audience) => {
          const isSelected = includes(selected, audience.value);
          return (
            <button
              key={audience.value}
              type="button"
              onClick={() => handleToggle(audience.value)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/60",
              )}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl">
                {audience.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-none">{audience.label}</div>
              </div>
              {isSelected ? (
                <span className="ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-4" />
                </span>
              ) : (
                <span className="ml-auto text-xs text-muted-foreground">
                  Tanlash
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {selected.length} ta auditoriya tanlandi
        </p>
      ) : null}
    </div>
  );
};

export default Index;
