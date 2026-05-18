import { get, isArray, map, filter, find } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { ChevronRight } from "lucide-react";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import {
  getOnboardingOptionsPath,
  getOnboardingOptionsQueryKey,
} from "@/modules/onboarding/lib/onboarding-options";
import { useOnboardingAssets } from "@/hooks/app/use-onboarding-base";
import PageAura from "../../components/page-aura.jsx";
import OnboardingSelectCard from "../../components/onboarding-select-card.jsx";

const getDefaultGoals = (t) => [
  {
    key: "lose",
    name: t("onboarding.goal.lose"),
    description: t("onboarding.goal.loseDescription"),
  },
  {
    key: "maintain",
    name: t("onboarding.goal.maintain"),
    description: t("onboarding.goal.maintainDescription"),
  },
  {
    key: "gain",
    name: t("onboarding.goal.gain"),
    description: t("onboarding.goal.gainDescription"),
  },
];

const goalToneByKey = (asset) => ({
  lose: {
    image: asset("lose"),
    accent: "from-rose-500/18 via-orange-400/10 to-transparent",
    border: "border-rose-500/20",
    pageTint: "from-rose-500/12 via-orange-400/8 to-transparent",
    dotTone: "bg-gradient-to-br from-rose-500 to-orange-500",
    buttonTone:
      "from-rose-500 to-orange-500 hover:from-rose-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
  },
  maintain: {
    image: asset("maintain"),
    accent: "from-emerald-500/18 via-teal-400/10 to-transparent",
    border: "border-emerald-500/20",
    pageTint: "from-emerald-500/12 via-teal-400/8 to-transparent",
    dotTone: "bg-gradient-to-br from-emerald-500 to-teal-500",
    buttonTone:
      "from-emerald-500 to-teal-500 hover:from-emerald-500/90 hover:to-teal-500/90 text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)]",
  },
  gain: {
    image: asset("gain"),
    accent: "from-sky-500/18 via-indigo-400/10 to-transparent",
    border: "border-sky-500/20",
    pageTint: "from-sky-500/12 via-indigo-400/8 to-transparent",
    dotTone: "bg-gradient-to-br from-sky-500 to-indigo-500",
    buttonTone:
      "from-sky-500 to-indigo-500 hover:from-sky-500/90 hover:to-indigo-500/90 text-white shadow-[0_18px_44px_rgba(59,130,246,0.24)]",
  },
});

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goal, weightGoal, setFields } = useOnboardingStore();
  const { asset } = useOnboardingAssets();

  useOnboardingAutoSave("user", "goal");

  const { data } = useGetQuery({
    url: getOnboardingOptionsPath("goals"),
    queryProps: { queryKey: getOnboardingOptionsQueryKey("goals") },
  });
  const apiGoals = get(data, "data.data", get(data, "data", []));
  const toneMap = React.useMemo(() => goalToneByKey(asset), [asset]);
  const defaultGoals = React.useMemo(() => getDefaultGoals(t), [t]);
  const goals = React.useMemo(() => {
    const source =
      isArray(apiGoals) && apiGoals.length ? apiGoals : defaultGoals;
    const weightGoals = filter(source, (item) => (item.goalType || "weight") === "weight");
    return map((weightGoals.length ? weightGoals : defaultGoals), (item, index) => {
      const tone =
        toneMap[item.key] ??
        toneMap[["lose", "maintain", "gain"][index % 3]] ??
        toneMap.maintain;
      return {
        value: item.key,
        label: item.name,
        title: item.name,
        description: item.description || "",
        calculationMode: item.calculationMode || item.key,
        ...tone,
        image: item.imageUrl || tone.image,
      };
    });
  }, [apiGoals, defaultGoals, toneMap]);

  const selectedGoal =
    find(goals, (item) => item.value === weightGoal) ??
    find(goals, (item) => item.calculationMode === goal) ??
    goals[1] ??
    goals[0];
  const hasSelection = Boolean(weightGoal || goal);

  const handleSelect = (value) => {
    const primary = find(goals, (item) => item.value === value);
    setFields({
      weightGoal: value,
      goal: primary?.calculationMode || value,
    });
  };

  const handleContinue = () => {
    if (hasSelection) {
      navigate("/user/onboarding/target-weight");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-all",
        hasSelection
          ? `bg-gradient-to-r ${selectedGoal.buttonTone}`
          : "bg-primary text-primary-foreground",
      )}
      size="lg"
      disabled={!hasSelection}
      onClick={handleContinue}
    >
      {t("onboarding.next")} <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={selectedGoal} />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.goal.question")} />

        <div className="relative mb-4 flex min-h-[210px] flex-[0.95] items-end justify-center overflow-hidden sm:min-h-[240px] md:mb-6 md:min-h-[340px] md:flex-[0.9]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedGoal.image}
              className="relative z-10 flex h-full w-full flex-col items-center justify-end"
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                loading="lazy"
                src={selectedGoal.image}
                className="max-h-[250px] w-full max-w-[260px] object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.12)] sm:max-h-[280px] sm:max-w-[300px] md:max-h-[340px] md:max-w-[360px] md:drop-shadow-[0_24px_44px_rgba(0,0,0,0.14)]"
                alt={`${selectedGoal.label} illustration`}
              />
            </motion.div>
          </AnimatePresence>

          <motion.div
            key={`goal-meta-${selectedGoal.value}`}
            className={cn(
              "absolute bottom-1 z-20 flex flex-col items-center gap-0.5 rounded-[24px] border bg-background/85 px-3 py-2 text-center backdrop-blur md:bottom-2 md:gap-1 md:rounded-[28px] md:px-4 md:py-3",
              selectedGoal.border,
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.08 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs md:tracking-[0.24em]">
              Goal
            </p>
            <p className="text-base font-bold md:text-lg">
              {selectedGoal.title}
            </p>
            <p className="max-w-[220px] text-xs text-muted-foreground md:max-w-[280px] md:text-sm">
              {selectedGoal.description}
            </p>
          </motion.div>
        </div>

        <motion.div
          className="z-10 grid w-full grid-cols-3 gap-2.5 pb-1 md:gap-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {map(goals, (item) => {
            const isActive =
              item.value === weightGoal ||
              (!weightGoal && item.calculationMode === goal);

            return (
              <OnboardingSelectCard
                key={item.value}
                active={isActive}
                description={item.description}
                imageAlt={`${item.label} illustration`}
                imageUrl={item.image}
                onClick={() => handleSelect(item.value)}
                title={item.label}
                tone={item}
                variant="image"
              />
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
