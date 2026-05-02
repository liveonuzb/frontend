import React from "react";
import { motion } from "framer-motion";
import { ChevronRightIcon, WalletCardsIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const tone = ONBOARDING_ACCENTS.amber;
const budgetPeriods = ["daily", "weekly", "monthly"];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    foodBudget,
    budgetPeriod,
    budgetCurrency,
    completedUserOnboardingSteps,
    setFields,
  } = useOnboardingStore();
  const [error, setError] = React.useState("");

  useOnboardingAutoSave("user", "food-budget");

  const markCompleted = () => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedUserOnboardingSteps ?? []), "food-budget"]),
      ),
    });
  };

  const goNext = () => {
    markCompleted();
    navigate("/user/onboarding/allergies");
  };

  const handleNext = () => {
    const value = String(foodBudget ?? "").trim();

    if (!value) {
      goNext();
      return;
    }

    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      setError(t("onboarding.foodBudget.error"));
      return;
    }

    setError("");
    goNext();
  };

  const handleSkip = () => {
    setFields({
      foodBudget: "",
      budgetPeriod: "weekly",
      budgetCurrency: "UZS",
    });
    goNext();
  };

  useOnboardingFooter(
    <div className="grid grid-cols-[0.42fr_1fr] gap-2">
      <Button type="button" variant="outline" className="h-12" onClick={handleSkip}>
        {t("onboarding.skip")}
      </Button>
      <Button
        type="button"
        className={cn("h-12 border-transparent bg-gradient-to-r", tone.buttonTone)}
        size="lg"
        onClick={handleNext}
      >
        {t("onboarding.next")}
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>,
  );

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />

      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.foodBudget.title")} />

        <motion.div
          className={cn(
            "mx-auto mb-4 w-full rounded-2xl border bg-background/90 px-4 py-4 text-center backdrop-blur",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={cn("mx-auto mb-2 flex size-10 items-center justify-center rounded-2xl", tone.badgeTone)}>
            <WalletCardsIcon className="size-5" />
          </div>
          <p className="text-sm font-semibold">
            {t("onboarding.foodBudget.description")}
          </p>
        </motion.div>

        <div className="grid gap-3 rounded-2xl border bg-background/90 p-3">
          <div className="grid grid-cols-3 gap-2">
            {budgetPeriods.map((period) => {
              const active = budgetPeriod === period;
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() =>
                    setFields({
                      budgetPeriod: period,
                      budgetCurrency: budgetCurrency || "UZS",
                    })
                  }
                  className={cn(
                    "h-11 rounded-xl border px-2 text-xs font-semibold transition-all",
                    active
                      ? `${tone.border} ${tone.badgeTone}`
                      : "border-border bg-background",
                  )}
                >
                  {t(`onboarding.foodBudget.periods.${period}`)}
                </button>
              );
            })}
          </div>

          <div>
            <div className="relative">
              <Input
                inputMode="numeric"
                type="number"
                min="0"
                value={foodBudget ?? ""}
                onChange={(event) => {
                  setError("");
                  setFields({
                    foodBudget: event.target.value,
                    budgetCurrency: "UZS",
                  });
                }}
                placeholder={t("onboarding.foodBudget.placeholder")}
                className="h-12 pr-14 text-base"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                UZS
              </span>
            </div>
            {error ? (
              <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("onboarding.foodBudget.helper")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
