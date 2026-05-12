import { map } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";
import useOnboardingBase from "@/hooks/app/use-onboarding-base";
import PageAura from "../../components/page-aura.jsx";
import OnboardingSelectCard from "../../components/onboarding-select-card.jsx";

const getPaceOptions = (goal, base, t) => [
  {
    value: 0.25,
    label: "0.25",
    title: t("onboarding.weeklyPace.options.025.title"),
    description: t("onboarding.weeklyPace.options.025.description"),
    image: `${base}/slow.webp`,
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
    image: `${base}/recommend.webp`,
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
    image: `${base}/focussed.webp`,
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
    image: `${base}/aggressive.webp`,
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
  const base = useOnboardingBase();

  useOnboardingAutoSave("user", "weekly-pace");

  const paceOptions = getPaceOptions(goal, base, t);
  const selectedPace =
    paceOptions.find((pace) => pace.value === Number(weeklyPace)) ??
    paceOptions[1];
  const hasSelection = Boolean(weeklyPace);

  const handleSelect = (value) => {
    setField("weeklyPace", value);
  };

  const handleContinue = () => {
    if (hasSelection) {
      navigate("/user/onboarding/other-goals");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-all",
        hasSelection
          ? `bg-gradient-to-r ${selectedPace.buttonTone}`
          : "bg-primary text-primary-foreground",
      )}
      disabled={!hasSelection}
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
        <div className="relative mb-3 flex min-h-[140px] flex-1 items-end justify-center overflow-hidden sm:min-h-[170px] md:mb-5 md:min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPace.image}
              className="relative z-10 flex h-full w-full flex-col items-center justify-end"
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                loading="lazy"
                src={selectedPace.image}
                className="max-h-[170px] w-full max-w-[200px] object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.12)] sm:max-h-[210px] sm:max-w-[240px] md:max-h-[280px] md:max-w-sm md:drop-shadow-[0_24px_44px_rgba(0,0,0,0.14)]"
                alt={t("onboarding.weeklyPace.heroAlt", {
                  value: selectedPace.label,
                })}
              />
            </motion.div>
          </AnimatePresence>

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
          className="z-10 grid w-full grid-cols-2 gap-2.5 pb-2"
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
          {map(paceOptions, (pace) => {
            const isActive = selectedPace.value === pace.value;

            return (
              <OnboardingSelectCard
                key={pace.value}
                active={isActive}
                description={pace.description}
                imageAlt={t("onboarding.weeklyPace.imageAlt", {
                  value: pace.label,
                })}
                imageUrl={pace.image}
                onClick={() => handleSelect(pace.value)}
                recommendedLabel={
                  pace.value === 0.5 ? t("onboarding.recommended") : null
                }
                title={t("onboarding.weeklyPace.rate", {
                  value: pace.label,
                })}
                tone={pace}
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
