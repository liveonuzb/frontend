import { find, findIndex, map, toNumber } from "lodash";
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";
import { useOnboardingAssets } from "@/hooks/app/use-onboarding-base";
import PageAura from "../../components/page-aura.jsx";

const getPaceOptions = (goal, asset, t) => [
  {
    value: 0.25,
    label: "0.25",
    title: t("onboarding.weeklyPace.options.025.title"),
    description: t("onboarding.weeklyPace.options.025.description"),
    image: asset("slow"),
    accent: "from-sky-500/20 via-cyan-400/10 to-transparent",
    border: "border-sky-500/20",
    pageTint: "from-sky-500/12 via-cyan-400/8 to-transparent",
    buttonTone:
      "from-sky-500 to-cyan-500 hover:from-sky-500/90 hover:to-cyan-500/90 text-white shadow-[0_18px_44px_rgba(14,165,233,0.26)]",
    badgeTone: "bg-sky-500/10 text-sky-700",
  },
  {
    value: 0.5,
    label: "0.5",
    title: t("onboarding.weeklyPace.options.05.title"),
    description: t("onboarding.weeklyPace.options.05.description"),
    image: asset("recommend"),
    accent: "from-emerald-500/20 via-lime-400/10 to-transparent",
    border: "border-emerald-500/20",
    pageTint: "from-emerald-500/12 via-lime-400/8 to-transparent",
    buttonTone:
      "from-emerald-500 to-lime-500 hover:from-emerald-500/90 hover:to-lime-500/90 text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)]",
    badgeTone: "bg-emerald-500/10 text-emerald-700",
  },
  {
    value: 0.75,
    label: "0.75",
    title: t("onboarding.weeklyPace.options.075.title"),
    description: t("onboarding.weeklyPace.options.075.description"),
    image: asset("focussed"),
    accent: "from-amber-500/20 via-orange-400/10 to-transparent",
    border: "border-amber-500/20",
    pageTint: "from-amber-500/12 via-orange-400/8 to-transparent",
    buttonTone:
      "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.26)]",
    badgeTone: "bg-amber-500/10 text-amber-700",
  },
  {
    value: 1,
    label: "1.0",
    title: t("onboarding.weeklyPace.options.1.title"),
    description: t("onboarding.weeklyPace.options.1.description"),
    image: asset("aggressive"),
    accent: "from-rose-500/20 via-fuchsia-400/10 to-transparent",
    border: "border-rose-500/20",
    pageTint: "from-rose-500/12 via-fuchsia-400/8 to-transparent",
    buttonTone:
      "from-rose-500 to-fuchsia-500 hover:from-rose-500/90 hover:to-fuchsia-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
    badgeTone: "bg-rose-500/10 text-rose-700",
  },
];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { weeklyPace, goal, setField } = useOnboardingStore();
  const { asset } = useOnboardingAssets();

  useOnboardingAutoSave("user", "weekly-pace");

  const paceOptions = getPaceOptions(goal, asset, t);
  const selectedIndex = React.useMemo(() => {
    const index = findIndex(
      paceOptions,
      (pace) => pace.value === toNumber(weeklyPace),
    );
    return index >= 0 ? index : 1;
  }, [paceOptions, weeklyPace]);
  const selectedPace =
    paceOptions[selectedIndex] ??
    find(paceOptions, (pace) => pace.value === toNumber(weeklyPace)) ??
    paceOptions[1];

  const handleSliderChange = React.useCallback(
    ([nextIndex]) => {
      const pace = paceOptions[toNumber(nextIndex)] ?? selectedPace;
      setField("weeklyPace", pace.value);
    },
    [paceOptions, selectedPace, setField],
  );

  const handleContinue = () => {
    if (!weeklyPace) {
      setField("weeklyPace", selectedPace.value);
    }
    navigate("/user/onboarding/activity-level");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-all",
        `bg-gradient-to-r ${selectedPace.buttonTone}`,
      )}
      onClick={handleContinue}
    >
      {t("onboarding.next")} <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden pt-3 md:pt-8 px-5">
      <PageAura tone={selectedPace} />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.weeklyPace.question")} />
        <div
          data-weekly-pace-hero="true"
          className="relative mb-2 flex min-h-[210px] flex-[0.9] items-end justify-center overflow-hidden sm:min-h-[230px] md:mb-5 md:min-h-[280px]"
        >
          <motion.div
            key={selectedPace.image}
            className="relative z-10 flex h-full w-full flex-col items-center justify-end"
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              loading="lazy"
              src={selectedPace.image}
              className="max-h-[220px] w-full max-w-[240px] object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.12)] sm:max-h-[240px] sm:max-w-[270px] md:max-h-[280px] md:max-w-sm md:drop-shadow-[0_24px_44px_rgba(0,0,0,0.14)]"
              alt={t("onboarding.weeklyPace.heroAlt", {
                value: selectedPace.label,
              })}
            />
          </motion.div>

          <motion.div
            key={`meta-${selectedPace.value}`}
            className={cn(
              "absolute bottom-0 z-20 flex flex-col items-center gap-0.5 rounded-[24px] border bg-background/85 px-3 py-2 text-center backdrop-blur md:gap-1 md:rounded-[28px] md:px-4 md:py-3",
              selectedPace.border,
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.08 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs md:tracking-[0.24em]">
              {t("onboarding.weeklyPace.metaLabel")}
            </p>
            <p className="text-base font-bold md:text-lg">
              {selectedPace.title}
            </p>
            <p className="text-xs text-muted-foreground md:text-sm">
              {t("onboarding.weeklyPace.rate", { value: selectedPace.label })}
            </p>
          </motion.div>
        </div>

        <motion.div
          data-testid="weekly-pace-slider-card"
          className={cn(
            "z-10 mt-auto flex h-[140px] w-full flex-col justify-between rounded-2xl border bg-background/90 px-4 py-4 shadow-sm backdrop-blur md:mx-auto md:max-w-2xl md:px-5",
            selectedPace.border,
          )}
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
          <p
            data-testid="weekly-pace-slider-description"
            className="line-clamp-2 w-full text-center text-xs font-medium leading-5 text-muted-foreground"
          >
            {selectedPace.description}
          </p>
          <div
            data-testid="weekly-pace-slider-controls"
            className="w-full"
          >
            <Slider
              aria-label={t("onboarding.weeklyPace.sliderLabel", {
                defaultValue: "Weekly pace",
              })}
              min={0}
              max={paceOptions.length - 1}
              step={1}
              value={[selectedIndex]}
              onValueChange={handleSliderChange}
            />

            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {map(paceOptions, (pace) => (
                <span
                  key={pace.value}
                  className={cn(
                    "rounded-xl px-1 py-1 text-[11px] font-bold tabular-nums transition-colors",
                    pace.value === selectedPace.value
                      ? selectedPace.badgeTone
                      : "text-muted-foreground",
                  )}
                >
                  {pace.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
