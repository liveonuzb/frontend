import { map } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { ChevronRight } from "lucide-react";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const goals = [
  {
    value: "lose",
    label: "Lose",
    title: "Lean down",
    description: "Burn fat and get leaner with a steady calorie deficit.",
    image: "/optimized/onboarding/lose.webp",
    accent: "from-rose-500/18 via-orange-400/10 to-transparent",
    border: "border-rose-500/20",
    pageTint: "from-rose-500/12 via-orange-400/8 to-transparent",
    dotTone: "bg-gradient-to-br from-rose-500 to-orange-500",
    buttonTone:
      "from-rose-500 to-orange-500 hover:from-rose-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
  },
  {
    value: "maintain",
    label: "Maintain",
    title: "Hold your rhythm",
    description: "Keep your current shape while building consistent habits.",
    image: "/optimized/onboarding/maintain.webp",
    accent: "from-emerald-500/18 via-teal-400/10 to-transparent",
    border: "border-emerald-500/20",
    pageTint: "from-emerald-500/12 via-teal-400/8 to-transparent",
    dotTone: "bg-gradient-to-br from-emerald-500 to-teal-500",
    buttonTone:
      "from-emerald-500 to-teal-500 hover:from-emerald-500/90 hover:to-teal-500/90 text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)]",
  },
  {
    value: "gain",
    label: "Gain",
    title: "Build up",
    description: "Add quality mass and strength with a stronger intake.",
    image: "/optimized/onboarding/gain.webp",
    accent: "from-sky-500/18 via-indigo-400/10 to-transparent",
    border: "border-sky-500/20",
    pageTint: "from-sky-500/12 via-indigo-400/8 to-transparent",
    dotTone: "bg-gradient-to-br from-sky-500 to-indigo-500",
    buttonTone:
      "from-sky-500 to-indigo-500 hover:from-sky-500/90 hover:to-indigo-500/90 text-white shadow-[0_18px_44px_rgba(59,130,246,0.24)]",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { goal, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "goal");

  const selectedGoal = goals.find((item) => item.value === goal) ?? goals[1];
  const hasSelection = Boolean(goal);

  const handleSelect = (value) => {
    setField("goal", value);
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
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden pt-3 md:pt-8  px-5">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          key={`goal-page-wash-${selectedGoal.value}`}
          className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-80",
            selectedGoal.pageTint,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        />
        <motion.div
          key={`goal-page-aura-top-${selectedGoal.value}`}
          className={cn(
            "absolute left-1/2 top-[8%] h-[26%] w-[82%] -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl md:top-[12%] md:h-[32%] md:w-[62%]",
            selectedGoal.pageTint,
          )}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
        />
        <motion.div
          key={`goal-page-aura-bottom-${selectedGoal.value}`}
          className={cn(
            "absolute inset-x-[10%] bottom-[-8%] h-[20%] rounded-full bg-gradient-to-t blur-3xl md:bottom-[-4%] md:h-[24%] md:inset-x-[18%]",
            selectedGoal.pageTint,
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.04 }}
        />
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question="What's your goal?" />

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
              <img loading="lazy"
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
            const isActive = selectedGoal.value === item.value;

            return (
              <motion.button
                key={item.value}
                type="button"
                onClick={() => handleSelect(item.value)}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={cn(
                  "relative flex min-h-[112px] flex-col items-start gap-2 rounded-[24px] border px-3 py-3 text-left md:min-h-[160px] md:gap-4 md:rounded-3xl md:px-4",
                  isActive
                    ? `bg-gradient-to-r ${item.accent} ${item.border}`
                    : "",
                )}
              >
                <motion.img
                  src={item.image}
                  className="size-11 rounded-2xl object-cover md:size-16"
                  alt={`${item.label} illustration`}
                  animate={
                    isActive
                      ? { scale: 1.06, rotate: -2 }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.24 }}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight md:text-base">
                    {item.label}
                  </p>
                  <p className="mt-1 hidden text-sm text-muted-foreground md:block">
                    {item.description}
                  </p>
                </div>

                <motion.div
                  className={cn(
                    "absolute right-3 top-3 flex size-5 shrink-0 items-center justify-center rounded-full border-2 md:size-6",
                    isActive
                      ? `${item.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                  animate={isActive ? { scale: 1 } : { scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                >
                  <motion.div
                    className={cn(
                      "size-3 rounded-full transition-all",
                      isActive ? item.dotTone : "bg-background",
                    )}
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
