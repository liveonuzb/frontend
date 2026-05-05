import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  WalletCardsIcon,
} from "lucide-react";
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
    navigate("/user/onboarding/allergies");
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
          <div
            className={cn(
              "mx-auto mb-2 flex size-10 items-center justify-center rounded-2xl",
              tone.badgeTone,
            )}
          >
            <WalletCardsIcon className="size-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold">
            {t("onboarding.foodBudget.description")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("onboarding.foodBudget.helper")}
          </p>
        </motion.div>

        <div className="grid gap-2 overflow-y-auto pb-5">
          {budgetTiers.map((tier, index) => {
            const active = foodBudgetTier === tier;
            return (
              <motion.button
                key={tier}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelect(tier)}
                className={cn(
                  "flex min-h-[76px] w-full items-center gap-3 rounded-2xl border bg-background/90 px-4 py-3 text-left shadow-sm backdrop-blur transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  active
                    ? `${tone.border} ${tone.cardTone}`
                    : "border-border/70",
                )}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl border",
                    active
                      ? `${tone.badgeTone} ${tone.border}`
                      : "border-border/70 bg-muted/40 text-muted-foreground",
                  )}
                >
                  <WalletCardsIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black">
                    {t(`onboarding.foodBudget.tiers.${tier}.label`)}
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-5 text-muted-foreground">
                    {t(`onboarding.foodBudget.tiers.${tier}.description`)}
                  </span>
                </span>
                {active ? (
                  <CheckCircle2Icon
                    className={cn("size-5 shrink-0", tone.textTone)}
                    aria-hidden="true"
                  />
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
