import { filter, get, includes, isArray, map } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { ChevronRight } from "lucide-react";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import useOnboardingBase from "@/hooks/app/use-onboarding-base";

const fallbackTone = (base) => ({
  image: `${base}/maintain.webp`,
  accent: "from-emerald-500/18 via-teal-400/10 to-transparent",
  border: "border-emerald-500/20",
  pageTint: "from-emerald-500/12 via-teal-400/8 to-transparent",
  dotTone: "bg-gradient-to-br from-emerald-500 to-teal-500",
  buttonTone:
    "from-emerald-500 to-teal-500 hover:from-emerald-500/90 hover:to-teal-500/90 text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)]",
});

const otherGoalTones = (base) => [
  fallbackTone(base),
  {
    image: `${base}/gain.webp`,
    accent: "from-sky-500/18 via-indigo-400/10 to-transparent",
    border: "border-sky-500/20",
    pageTint: "from-sky-500/12 via-indigo-400/8 to-transparent",
    dotTone: "bg-gradient-to-br from-sky-500 to-indigo-500",
    buttonTone:
      "from-sky-500 to-indigo-500 hover:from-sky-500/90 hover:to-indigo-500/90 text-white shadow-[0_18px_44px_rgba(59,130,246,0.24)]",
  },
  {
    image: `${base}/lose.webp`,
    accent: "from-rose-500/18 via-orange-400/10 to-transparent",
    border: "border-rose-500/20",
    pageTint: "from-rose-500/12 via-orange-400/8 to-transparent",
    dotTone: "bg-gradient-to-br from-rose-500 to-orange-500",
    buttonTone:
      "from-rose-500 to-orange-500 hover:from-rose-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { goals: selectedGoals = [], setFields } = useOnboardingStore();
  const base = useOnboardingBase();

  useOnboardingAutoSave("user", "other-goals");

  const { data } = useGetQuery({
    url: "/user/onboarding/goals",
    queryProps: { queryKey: ["user", "onboarding", "goals"] },
  });
  const apiGoals = get(data, "data.data", get(data, "data", []));
  const toneList = React.useMemo(() => otherGoalTones(base), [base]);
  const goals = React.useMemo(() => {
    const source = isArray(apiGoals) ? apiGoals : [];
    return source
      .filter((item) => item.goalType === "other")
      .map((item, index) => {
        const tone = toneList[index % toneList.length] ?? toneList[0];
        return {
          value: item.key,
          label: item.name,
          title: item.name,
          description: item.description || "",
          ...tone,
          image: item.imageUrl || tone.image,
        };
      });
  }, [apiGoals, toneList]);

  const selectedGoal =
    goals.find((item) => includes(selectedGoals, item.value)) ??
    goals[0] ??
    {
      value: "other-goals",
      title: "Qo'shimcha maqsadlar",
      description: "",
      ...fallbackTone(base),
    };

  const handleSelect = (value) => {
    setFields({
      goals: includes(selectedGoals, value)
        ? filter(selectedGoals, (item) => item !== value)
        : [...selectedGoals, value],
    });
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r transition-all",
        selectedGoal.buttonTone,
      )}
      size="lg"
      onClick={() => navigate("/user/onboarding/target-weight")}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden px-5 pt-3 md:pt-8">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          key={`other-goals-page-wash-${selectedGoal.value}`}
          className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-80",
            selectedGoal.pageTint,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        />
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question="Yana qanday maqsadlaringiz bor?" />

        <div className="relative mb-4 flex min-h-[170px] flex-[0.75] items-end justify-center overflow-hidden md:mb-6 md:min-h-[260px]">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedGoal.image}
              loading="lazy"
              src={selectedGoal.image}
              className="max-h-[210px] w-full max-w-[240px] object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.12)] md:max-h-[300px] md:max-w-[330px]"
              alt={`${selectedGoal.title} illustration`}
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
        </div>

        <motion.div
          className="z-10 grid w-full grid-cols-2 gap-2.5 pb-1 md:grid-cols-3 md:gap-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {goals.length === 0 ? (
            <div className="col-span-full rounded-[24px] border bg-background/80 px-4 py-5 text-center text-sm text-muted-foreground">
              Qo'shimcha maqsadlar yo'q
            </div>
          ) : (
            map(goals, (item) => {
              const isActive = includes(selectedGoals, item.value);

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
                    "relative flex min-h-[120px] flex-col items-start gap-2 rounded-[24px] border px-3 py-3 text-left md:min-h-[150px] md:gap-4 md:rounded-3xl md:px-4",
                    isActive
                      ? `bg-gradient-to-r ${item.accent} ${item.border}`
                      : "",
                  )}
                >
                  <img
                    src={item.image}
                    className="size-11 rounded-2xl object-cover md:size-16"
                    alt={`${item.label} illustration`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight md:text-base">
                      {item.label}
                    </p>
                    <p className="mt-1 hidden text-sm text-muted-foreground md:block">
                      {item.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 md:size-6",
                      isActive
                        ? `${item.border} bg-background/70`
                        : "border-muted-foreground/25",
                    )}
                  >
                    <span
                      className={cn(
                        "size-3 rounded-full transition-all",
                        isActive ? item.dotTone : "bg-background",
                      )}
                    />
                  </span>
                </motion.button>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
