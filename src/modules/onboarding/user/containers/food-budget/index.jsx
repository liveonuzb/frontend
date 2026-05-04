import React from "react";
import { motion } from "framer-motion";
import { ChevronRightIcon, WalletCardsIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const tone = ONBOARDING_ACCENTS.amber;
const budgetPeriods = ["daily", "weekly", "monthly"];
const DEFAULT_BUDGET_PERIOD = "weekly";
const DEFAULT_FOOD_BUDGETS = {
  daily: 50000,
  weekly: 250000,
  monthly: 1000000,
};

const getDefaultFoodBudget = (period) =>
  DEFAULT_FOOD_BUDGETS[period] ?? DEFAULT_FOOD_BUDGETS[DEFAULT_BUDGET_PERIOD];

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
  const defaultAppliedRef = React.useRef(false);

  useOnboardingAutoSave("user", "food-budget");

  React.useEffect(() => {
    if (defaultAppliedRef.current) {
      return;
    }

    if (String(foodBudget ?? "").trim()) {
      defaultAppliedRef.current = true;
      return;
    }

    defaultAppliedRef.current = true;
    const nextPeriod = budgetPeriod || DEFAULT_BUDGET_PERIOD;
    setFields({
      foodBudget: String(getDefaultFoodBudget(nextPeriod)),
      budgetPeriod: nextPeriod,
      budgetCurrency: budgetCurrency || "UZS",
    });
  }, [budgetCurrency, budgetPeriod, foodBudget, setFields]);

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedUserOnboardingSteps ?? []), "food-budget"]),
      ),
    });
  }, [completedUserOnboardingSteps, setFields]);

  const goNext = React.useCallback(() => {
    markCompleted();
    navigate("/user/onboarding/allergies");
  }, [markCompleted, navigate]);

  const handleNext = React.useCallback(() => {
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
  }, [foodBudget, goNext, t]);

  const handleSkip = React.useCallback(() => {
    setFields({
      foodBudget: "",
      budgetPeriod: DEFAULT_BUDGET_PERIOD,
      budgetCurrency: "UZS",
    });
    goNext();
  }, [goNext, setFields]);

  const handlePeriodChange = React.useCallback(
    (period) => {
      setError("");
      setFields({
        budgetPeriod: period,
        budgetCurrency: budgetCurrency || "UZS",
        foodBudget: String(getDefaultFoodBudget(period)),
      });
    },
    [budgetCurrency, setFields],
  );

  const foodBudgetValue = React.useMemo(() => {
    if (!String(foodBudget ?? "").trim()) {
      return getDefaultFoodBudget(budgetPeriod);
    }

    const value = Number(foodBudget);
    return Number.isFinite(value) ? value : getDefaultFoodBudget(budgetPeriod);
  }, [budgetPeriod, foodBudget]);

  const footerContent = React.useMemo(
    () => (
      <div className={"space-y-2"}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-12 w-full border-transparent"
          onClick={handleSkip}
        >
          {t("onboarding.skip")}
        </Button>
        <Button
          type="button"
          className={cn(
            "h-12 w-full border-transparent bg-gradient-to-r",
            tone.buttonTone,
          )}
          size="lg"
          onClick={handleNext}
        >
          {t("onboarding.next")}
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    ),
    [handleNext, handleSkip, t],
  );
  useOnboardingFooter(footerContent);

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
                  onClick={() => handlePeriodChange(period)}
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
            <NumberField
              value={foodBudgetValue}
              onValueChange={(value) => {
                const nextValue = Number(value);
                if (!Number.isFinite(nextValue)) {
                  return;
                }

                setError("");
                setFields({
                  foodBudget: String(Math.max(0, Math.round(nextValue))),
                  budgetCurrency: "UZS",
                });
              }}
              min={0}
              step={10000}
            >
              <NumberFieldGroup className="h-12 w-full items-center rounded-xl bg-background">
                <NumberFieldDecrement className="px-3 rounded-s-xl" />
                <NumberFieldInput
                  inputMode="numeric"
                  placeholder={t("onboarding.foodBudget.placeholder")}
                  className="px-3 text-center text-base font-semibold"
                />
                <span className="flex h-full shrink-0 items-center px-2 text-xs font-bold text-muted-foreground">
                  UZS
                </span>
                <NumberFieldIncrement className="px-3 rounded-e-xl" />
              </NumberFieldGroup>
            </NumberField>
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
