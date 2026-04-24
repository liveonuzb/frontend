import { map } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";

const getAggressiveImage = (goal) => {
  if (goal === "lose") return "/onboarding/lose.webp";
  if (goal === "gain") return "/onboarding/gain.webp";
  return "/onboarding/maintain.webp";
};

const getPaceOptions = (goal) => [
  {
    value: 0.25,
    label: "0.25",
    title: "Easy rhythm",
    description: "Small weekly changes with a lighter routine.",
    image: "/onboarding/slow.webp",
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
    title: "Balanced pace",
    description: "Best balance between momentum and sustainability.",
    image: "/onboarding/recommend.webp",
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
    title: "Focused push",
    description: "Noticeable weekly progress with more structure.",
    image: "/onboarding/focussed.webp",
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
    title: "Fast track",
    description: "Most aggressive pace. Better for short bursts.",
    image: "/onboarding/aggressive.webp",
    accent: "from-rose-500/20 via-fuchsia-400/10 to-transparent",
    border: "border-rose-500/20",
    pageTint: "from-rose-500/12 via-fuchsia-400/8 to-transparent",
    buttonTone:
      "from-rose-500 to-fuchsia-500 hover:from-rose-500/90 hover:to-fuchsia-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
    badgeTone: "bg-rose-500/10 text-rose-700",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { weeklyPace, goal, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "weekly-pace");

  const paceOptions = getPaceOptions(goal);
  const selectedPace =
    paceOptions.find((pace) => pace.value === Number(weeklyPace)) ??
    paceOptions[1];
  const hasSelection = Boolean(weeklyPace);

  const handleSelect = (value) => {
    setField("weeklyPace", value);
  };

  const handleContinue = () => {
    if (hasSelection) {
      navigate("/user/onboarding/activity-level");
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
      size="lg"
      disabled={!hasSelection}
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden pt-3 md:pt-8 px-5">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          key={`page-wash-${selectedPace.value}`}
          className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-80",
            selectedPace.pageTint,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        />
        <motion.div
          key={`page-aura-top-${selectedPace.value}`}
          className={cn(
            "absolute left-1/2 top-[6%] h-[28%] w-[82%] -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl md:top-[10%] md:h-[34%] md:w-[68%]",
            selectedPace.pageTint,
          )}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
        />
        <motion.div
          key={`page-aura-bottom-${selectedPace.value}`}
          className={cn(
            "absolute inset-x-[10%] bottom-[-8%] h-[22%] rounded-full bg-gradient-to-t blur-3xl md:bottom-[-4%] md:h-[26%] md:inset-x-[18%]",
            selectedPace.pageTint,
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.04 }}
        />
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question="Set your weekly pace" />
        <div className="relative mb-3 flex min-h-[190px] flex-[0.95] items-end justify-center overflow-hidden sm:min-h-[220px] md:mb-5 md:min-h-[320px] md:flex-[0.9]">
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
                className="max-h-[220px] w-full max-w-[250px] object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.12)] sm:max-h-[250px] sm:max-w-[280px] md:max-h-[300px] md:max-w-sm md:drop-shadow-[0_24px_44px_rgba(0,0,0,0.14)]"
                alt={`${selectedPace.label} pace illustration`}
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
              Weekly pace
            </p>
            <p className="text-base font-bold md:text-lg">
              {selectedPace.title}
            </p>
            <p className="text-xs text-muted-foreground md:text-sm">
              {selectedPace.label} kg / week
            </p>
          </motion.div>
        </div>

        <motion.div
          className="z-10 grid w-full grid-cols-2 gap-2.5 pb-1"
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
              <motion.button
                key={pace.value}
                type="button"
                onClick={() => handleSelect(pace.value)}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0 },
                }}
                animate={{
                  scale: 1,
                }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={cn(
                  "relative flex min-h-[102px] flex-col items-start gap-2 rounded-[24px] border px-3 py-3 text-left md:min-h-0 md:gap-4 md:rounded-3xl md:px-4",
                  isActive
                    ? `bg-gradient-to-r ${pace.accent} ${pace.border}`
                    : "",
                )}
              >
                <motion.img
                  src={pace.image}
                  className="size-10 rounded-2xl object-cover md:size-16"
                  alt={`${pace.label} illustration`}
                  animate={
                    isActive
                      ? { scale: 1.06, rotate: -2 }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.24 }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                    <p className="text-sm font-bold md:text-base">
                      {pace.label} kg
                    </p>
                    {pace.value === 0.5 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold md:px-2 md:text-[11px]",
                          pace.badgeTone,
                        )}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground md:hidden">
                    {pace.title}
                  </p>
                  <p className="hidden text-sm text-muted-foreground md:block">
                    {pace.description}
                  </p>
                </div>

                <motion.div
                  className={cn(
                    "absolute right-3 top-3 flex size-5 shrink-0 items-center justify-center rounded-full border-2 md:size-6",
                    isActive
                      ? `${pace.border} ${pace.accent}`
                      : "border-muted-foreground/25",
                  )}
                  animate={isActive ? { scale: 1 } : { scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                >
                  <motion.div
                    className="size-3 rounded-full bg-background"
                    animate={
                      isActive
                        ? { scale: 0.9, opacity: 1 }
                        : { scale: 0.6, opacity: 0 }
                    }
                    transition={{ duration: 0.18 }}
                  />
                </motion.div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
