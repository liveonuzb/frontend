import React from "react";
import { ChevronRightIcon, WalletCardsIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import OnboardingSelectCard from "../../components/onboarding-select-card.jsx";

const tone = ONBOARDING_ACCENTS.amber;
const budgetTiers = ["low", "medium", "high"];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { foodBudgetTier, completedUserOnboardingSteps, setFields } =
    useOnboardingStore();

  useOnboardingAutoSave("user", "food-budget");

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedUserOnboardingSteps ?? []), "food-budget"]),
      ),
    });
  }, [completedUserOnboardingSteps, setFields]);

  const goNext = React.useCallback(() => {
    markCompleted();
    navigate("/user/onboarding/diet-requirements");
  }, [markCompleted, navigate]);

  const handleSelect = React.useCallback(
    (tier) => {
      setFields({
        foodBudgetTier: tier,
        foodBudget: "",
        budgetPeriod: null,
        budgetCurrency: "UZS",
      });
    },
    [setFields],
  );

  const handleSkip = React.useCallback(() => {
    setFields({
      foodBudgetTier: null,
      foodBudget: "",
      budgetPeriod: null,
      budgetCurrency: "UZS",
    });
    goNext();
  }, [goNext, setFields]);

  const handleNext = React.useCallback(() => {
    if (!foodBudgetTier) {
      setFields({
        foodBudgetTier: null,
        foodBudget: "",
        budgetPeriod: null,
        budgetCurrency: "UZS",
      });
    }

    goNext();
  }, [foodBudgetTier, goNext, setFields]);

  const footerContent = React.useMemo(
    () => (
      <div className="space-y-2">
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
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    ),
    [handleNext, handleSkip, t],
  );
  useOnboardingFooter(footerContent);

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col">
        <OnboardingQuestion question={t("onboarding.foodBudget.title")} />
        <div className="mx-auto mt-2 w-full rounded-2xl border bg-background/85 px-4 py-3 text-sm font-medium leading-6 text-muted-foreground md:max-w-2xl">
          <p>{t("onboarding.foodBudget.description")}</p>
          <p className="mt-1 font-semibold">{t("onboarding.foodBudget.helper")}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <div className="flex min-h-full flex-col justify-center gap-3 md:mx-auto md:max-w-2xl md:gap-4">
            {budgetTiers.map((tier, index) => {
              const active = foodBudgetTier === tier;
              return (
                <OnboardingSelectCard
                  key={tier}
                  active={active}
                  description={t(
                    `onboarding.foodBudget.tiers.${tier}.description`,
                  )}
                  icon={WalletCardsIcon}
                  onClick={() => handleSelect(tier)}
                  title={t(`onboarding.foodBudget.tiers.${tier}.label`)}
                  tone={tone}
                  transitionDelay={index * 0.04}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
