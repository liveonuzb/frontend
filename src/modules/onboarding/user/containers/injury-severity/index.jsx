import React from "react";
import { motion } from "framer-motion";
import { ChevronRightIcon, ShieldCheckIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const tone = ONBOARDING_ACCENTS.amber;
const severityOptions = ["none", "mild", "moderate", "severe"];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const injurySeverity = useOnboardingStore(
    (state) => state.injurySeverity || "none",
  );
  const completedSteps = useOnboardingStore(
    (state) => state.completedUserOnboardingSteps,
  );
  const setFields = useOnboardingStore((state) => state.setFields);

  useOnboardingAutoSave("user", "injury-severity");

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedSteps ?? []), "injury-severity"]),
      ),
    });
  }, [completedSteps, setFields]);

  const goNext = React.useCallback(() => {
    setFields({ injurySeverity });
    markCompleted();
    navigate("/user/onboarding/age");
  }, [injurySeverity, markCompleted, navigate, setFields]);

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      size="lg"
      onClick={goNext}
    >
      {t("onboarding.next")}
      <ChevronRightIcon className="size-4" aria-hidden="true" />
    </Button>,
  );

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={t("onboarding.healthConstraints.injurySeverityQuestion")}
        />

        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pb-5 justify-center">
          {severityOptions.map((option) => {
            const isActive = injurySeverity === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFields({ injurySeverity: option })}
                className={cn(
                  "flex min-h-[76px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive
                    ? `bg-gradient-to-br ${tone.cardTone} ${tone.border}`
                    : "border-border/70 bg-background/90",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                    isActive
                      ? tone.badgeTone
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <ShieldCheckIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {t(`onboarding.healthConstraints.severity.${option}`)}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t(
                      `onboarding.healthConstraints.severityDescriptions.${option}`,
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
