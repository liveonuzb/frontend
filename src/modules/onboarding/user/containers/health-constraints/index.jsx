import { filter, get, includes, map } from "lodash";
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckIcon, ChevronRightIcon, CircleSlashIcon, HeartPulseIcon, Loader2Icon } from "lucide-react";
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
  const { healthConstraints, setField } = useOnboardingStore();

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
  const selectedOptions = filter(options, (item) => includes(healthConstraints, item.key));
  const hasSelection = selectedOptions.length > 0;
  const activeTone = getTone(selectedOptions[0]);

  const handleToggle = (key) => {
    if (key === "none") {
      setField("healthConstraints", ["none"]);
      return;
    }

    const filtered = filter(healthConstraints, (item) => item !== "none");
    if (includes(filtered, key)) {
      setField("healthConstraints", filter(filtered, (item) => item !== key));
      return;
    }

    setField("healthConstraints", [...filtered, key]);
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-all",
        hasSelection ? `bg-gradient-to-r ${activeTone.buttonTone}` : "",
      )}
      size="lg"
      disabled={!hasSelection}
      onClick={() => navigate("/user/onboarding/age")}
    >
      {t("onboarding.next")}
      <ChevronRightIcon />
    </Button>,
  );

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={activeTone} />

      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.healthConstraints.question")} />

        <motion.div
          key={`health-meta-${selectedOptions.map((item) => item.key).join("-") || "empty"}`}
          className={cn(
            "mx-auto mb-3 w-full max-w-[320px] rounded-[20px] border bg-background/85 px-3 py-2 text-center backdrop-blur md:mb-4 md:max-w-[420px] md:rounded-[24px] md:px-4 md:py-3",
            activeTone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
            {t("onboarding.healthConstraints.metaLabel")}
          </p>
          <p className="text-sm font-bold md:text-base">
            {hasSelection
              ? selectedOptions[0]?.key === "none"
                ? t("onboarding.healthConstraints.noneSummary")
                : t("onboarding.healthConstraints.selectedCount", { count: selectedOptions.length })
              : t("onboarding.healthConstraints.summaryHint")}
          </p>
        </motion.div>

        <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto pb-5 md:gap-2.5">
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            map(options, (item) => {
              const isActive = includes(healthConstraints, item.key);
              const itemTone = getTone(item);
              const Icon = item.key === "none" ? CircleSlashIcon : HeartPulseIcon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggle(item.key)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative flex min-h-[64px] items-center gap-2 rounded-[18px] border px-2.5 py-2 text-left transition-all md:min-h-[80px] md:gap-3 md:rounded-2xl md:px-3 md:py-3",
                    isActive
                      ? `bg-gradient-to-br ${itemTone.cardTone} ${itemTone.border}`
                      : "border-border/70 bg-background/90 hover:border-primary/30",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors md:size-10 md:rounded-2xl",
                      isActive ? itemTone.badgeTone : "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="size-4 md:size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight text-foreground md:text-sm">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {item.description || t("onboarding.healthConstraints.defaultDescription")}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors md:size-6",
                      isActive
                        ? `${itemTone.border} bg-background/70`
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    <CheckIcon
                      className={cn(
                        "size-3 transition-all md:size-4",
                        isActive ? itemTone.textTone : "text-transparent",
                      )}
                    />
                  </div>
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
