import { filter, get, includes, map } from "lodash";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  CheckIcon,
  ChevronRightIcon,
  CircleSlashIcon,
  HeartPulseIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const getTone = (selected) => {
  if (selected?.type === "medical_condition") return ONBOARDING_ACCENTS.rose;
  if (selected?.type === "mobility_limitation") return ONBOARDING_ACCENTS.sky;
  if (selected?.key === "none") return ONBOARDING_ACCENTS.green;
  return ONBOARDING_ACCENTS.amber;
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    healthConstraints,
    completedUserOnboardingSteps,
    setField,
    setFields,
  } = useOnboardingStore();
  const shouldReduceMotion = useReducedMotion();

  useOnboardingAutoSave("user", "health-constraints");

  const { data, isLoading } = useGetQuery({
    url: "/user/onboarding/health-constraints",
    queryProps: { queryKey: ["user", "onboarding", "health-constraints"] },
  });
  const constraints = get(data, "data.data", get(data, "data", []));
  const noneOption = React.useMemo(
    () => ({
      key: "none",
      name: t("onboarding.healthConstraints.none"),
      description: t("onboarding.healthConstraints.noneDescription"),
      type: "none",
    }),
    [t],
  );
  const options = React.useMemo(
    () => [noneOption, ...(constraints ?? [])],
    [constraints, noneOption],
  );
  const selectedOptions = filter(options, (item) =>
    includes(healthConstraints, item.key),
  );
  const hasSelection = selectedOptions.length > 0;
  const activeTone = getTone(selectedOptions[0]);
  const selectedNone =
    selectedOptions.length === 1 && selectedOptions[0]?.key === "none";

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([
          ...(completedUserOnboardingSteps ?? []),
          "health-constraints",
        ]),
      ),
    });
  }, [completedUserOnboardingSteps, setFields]);

  const handleToggle = (key) => {
    if (key === "none") {
      setFields({
        healthConstraints: ["none"],
        injurySeverity: "",
        forbiddenExercises: [],
        medications: "",
        supplements: "",
      });
      return;
    }

    const filtered = filter(healthConstraints, (item) => item !== "none");
    if (includes(filtered, key)) {
      setField(
        "healthConstraints",
        filter(filtered, (item) => item !== key),
      );
      return;
    }

    setField("healthConstraints", [...filtered, key]);
  };

  const goNext = React.useCallback(() => {
    if (!hasSelection) return;
    markCompleted();
    navigate(
      selectedNone
        ? "/user/onboarding/age"
        : "/user/onboarding/injury-severity",
    );
  }, [hasSelection, markCompleted, navigate, selectedNone]);

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-colors",
        hasSelection ? `bg-gradient-to-r ${activeTone.buttonTone}` : "",
      )}
      size="lg"
      disabled={!hasSelection}
      onClick={goNext}
    >
      {t("onboarding.next")}
      <ChevronRightIcon className="size-4" aria-hidden="true" />
    </Button>,
  );

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={activeTone} />

      <div className="relative z-10 flex h-full w-full flex-1 flex-col">
        <OnboardingQuestion
          question={t("onboarding.healthConstraints.question")}
        />
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto justify-center pb-5">
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2Icon
                className="size-6 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          ) : (
            map(options, (item) => {
              const isActive = includes(healthConstraints, item.key);
              const itemTone = getTone(item);
              const Icon =
                item.key === "none" ? CircleSlashIcon : HeartPulseIcon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggle(item.key)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative flex items-center gap-3 py-3 rounded-2xl border text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:px-4",
                    isActive
                      ? `bg-gradient-to-br ${itemTone.cardTone} ${itemTone.border}`
                      : "border-border/70 bg-background/90",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors md:size-11",
                      isActive
                        ? itemTone.badgeTone
                        : "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold leading-tight text-foreground">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                      {item.description ||
                        t("onboarding.healthConstraints.defaultDescription")}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isActive
                        ? `${itemTone.border} bg-background/70`
                        : "border-border bg-background text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    <CheckIcon
                      className={cn(
                        "size-4 transition-colors",
                        isActive ? itemTone.textTone : "text-transparent",
                      )}
                    />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
