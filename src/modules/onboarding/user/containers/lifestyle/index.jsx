import React from "react";
import { motion } from "framer-motion";
import {
  BriefcaseIcon,
  ChevronRightIcon,
  Clock3Icon,
  DumbbellIcon,
  MoonIcon,
  SaladIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

import { map, toNumber, trim } from "lodash";

const tone = ONBOARDING_ACCENTS.green;
const workoutCounts = [0, 1, 2, 3, 4, 5, 6, 7];
const workoutExperiences = ["beginner", "intermediate", "advanced"];
const workTypes = ["sedentary", "mixed", "active"];
const fastFoodFrequencies = ["rarely", "weekly", "several-weekly", "daily"];
const sweetDrinkHabits = ["rarely", "weekly", "daily"];
const cookingTimes = ["under-15", "15-30", "30-60", "60-plus"];
const cookingAccesses = ["home-cooking", "mixed", "ready-meals"];
const cardioLevels = ["low", "medium", "high"];

const OptionGroup = ({ icon: Icon, label, options, value, onChange, tKey }) => (
  <section className="rounded-2xl border bg-background/90 p-3">
    <div className="mb-2 flex items-center gap-2">
      <span className={cn("flex size-8 items-center justify-center rounded-xl", tone.badgeTone)}>
        <Icon className="size-4" />
      </span>
      <p className="text-sm font-bold">{label}</p>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {map(options, (option) => {
        const active = String(value) === String(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(String(option))}
            className={cn(
              "min-h-11 rounded-xl border px-2 py-2 text-sm font-semibold transition-colors",
              active
                ? `${tone.border} ${tone.badgeTone}`
                : "border-border/70 bg-background hover:border-primary/30",
            )}
          >
            {tKey(option)}
          </button>
        );
      })}
    </div>
  </section>
);

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    weeklyWorkoutCount,
    workoutExperience,
    sleepHours,
    workType,
    fastFoodFrequency,
    sweetDrinkHabit,
    cookingTime,
    cookingAccess,
    playsFootball,
    cardioLevel,
    completedUserOnboardingSteps,
    setFields,
  } = useOnboardingStore();
  const [error, setError] = React.useState("");

  useOnboardingAutoSave("user", "lifestyle");

  const setField = React.useCallback(
    (field, value) => {
      setError("");
      setFields({ [field]: value });
    },
    [setFields],
  );

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedUserOnboardingSteps ?? []), "lifestyle"]),
      ),
    });
  }, [completedUserOnboardingSteps, setFields]);

  const handleNext = React.useCallback(() => {
    const workoutCount = toNumber(weeklyWorkoutCount);
    if (
      !Number.isInteger(workoutCount) ||
      workoutCount < 0 ||
      workoutCount > 7
    ) {
      setError(t("onboarding.lifestyle.errors.weeklyWorkoutCount"));
      return;
    }

    if (!workoutExperience) {
      setError(t("onboarding.lifestyle.errors.workoutExperience"));
      return;
    }

    const sleep = trim(String(sleepHours ?? ""));
    if (sleep) {
      const sleepNumber = toNumber(sleep);
      if (!Number.isFinite(sleepNumber) || sleepNumber < 0 || sleepNumber > 16) {
        setError(t("onboarding.lifestyle.errors.sleepHours"));
        return;
      }
    }

    markCompleted();
    navigate("/user/onboarding/meal-frequency");
  }, [
    markCompleted,
    navigate,
    sleepHours,
    t,
    weeklyWorkoutCount,
    workoutExperience,
  ]);

  useOnboardingFooter(
    <Button
      type="button"
      className={cn("h-12 w-full border-transparent bg-gradient-to-r", tone.buttonTone)}
      size="lg"
      onClick={handleNext}
    >
      {t("onboarding.next")}
      <ChevronRightIcon className="size-4" />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.lifestyle.title")} />

        <motion.div
          className={cn(
            "mx-auto mb-3 w-full rounded-2xl border bg-background/90 px-3 py-3 text-center backdrop-blur",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold">
            {t("onboarding.lifestyle.description")}
          </p>
          {error ? (
            <p className="mt-2 text-xs font-semibold text-destructive">
              {error}
            </p>
          ) : null}
        </motion.div>

        <div className="grid flex-1 content-start gap-3 overflow-y-auto pb-5">
          <OptionGroup
            icon={DumbbellIcon}
            label={t("onboarding.lifestyle.weeklyWorkoutCount")}
            options={workoutCounts}
            value={weeklyWorkoutCount}
            onChange={(value) => setField("weeklyWorkoutCount", value)}
            tKey={(value) =>
              t("onboarding.lifestyle.weeklyWorkoutCountOption", {
                count: value,
              })
            }
          />

          <OptionGroup
            icon={Clock3Icon}
            label={t("onboarding.lifestyle.workoutExperience")}
            options={workoutExperiences}
            value={workoutExperience}
            onChange={(value) => setField("workoutExperience", value)}
            tKey={(value) =>
              t(`onboarding.lifestyle.workoutExperiences.${value}`)
            }
          />

          <section className="rounded-2xl border bg-background/90 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("flex size-8 items-center justify-center rounded-xl", tone.badgeTone)}>
                <MoonIcon className="size-4" />
              </span>
              <p className="text-sm font-bold">
                {t("onboarding.lifestyle.sleepHours")}
              </p>
            </div>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              max="16"
              step="0.5"
              value={sleepHours ?? ""}
              onChange={(event) => setField("sleepHours", event.target.value)}
              placeholder={t("onboarding.lifestyle.sleepPlaceholder")}
              className="h-12"
            />
          </section>

          <OptionGroup
            icon={BriefcaseIcon}
            label={t("onboarding.lifestyle.workType")}
            options={workTypes}
            value={workType}
            onChange={(value) => setField("workType", value)}
            tKey={(value) => t(`onboarding.lifestyle.workTypes.${value}`)}
          />

          <OptionGroup
            icon={SaladIcon}
            label={t("onboarding.lifestyle.cookingAccess")}
            options={cookingAccesses}
            value={cookingAccess}
            onChange={(value) => setField("cookingAccess", value)}
            tKey={(value) =>
              t(`onboarding.lifestyle.cookingAccesses.${value}`)
            }
          />

          <OptionGroup
            icon={Clock3Icon}
            label={t("onboarding.lifestyle.cookingTime")}
            options={cookingTimes}
            value={cookingTime}
            onChange={(value) => setField("cookingTime", value)}
            tKey={(value) => t(`onboarding.lifestyle.cookingTimes.${value}`)}
          />

          <OptionGroup
            icon={SaladIcon}
            label={t("onboarding.lifestyle.fastFoodFrequency")}
            options={fastFoodFrequencies}
            value={fastFoodFrequency}
            onChange={(value) => setField("fastFoodFrequency", value)}
            tKey={(value) =>
              t(`onboarding.lifestyle.fastFoodFrequencies.${value}`)
            }
          />

          <OptionGroup
            icon={SaladIcon}
            label={t("onboarding.lifestyle.sweetDrinkHabit")}
            options={sweetDrinkHabits}
            value={sweetDrinkHabit}
            onChange={(value) => setField("sweetDrinkHabit", value)}
            tKey={(value) =>
              t(`onboarding.lifestyle.sweetDrinkHabits.${value}`)
            }
          />

          <OptionGroup
            icon={DumbbellIcon}
            label={t("onboarding.lifestyle.cardioLevel")}
            options={cardioLevels}
            value={cardioLevel}
            onChange={(value) => setField("cardioLevel", value)}
            tKey={(value) => t(`onboarding.lifestyle.cardioLevels.${value}`)}
          />

          <section className="rounded-2xl border bg-background/90 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("flex size-8 items-center justify-center rounded-xl", tone.badgeTone)}>
                <DumbbellIcon className="size-4" />
              </span>
              <p className="text-sm font-bold">
                {t("onboarding.lifestyle.playsFootball")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {map([false, true], (value) => {
                const active = Boolean(playsFootball) === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setField("playsFootball", value)}
                    className={cn(
                      "min-h-11 rounded-xl border px-2 py-2 text-sm font-semibold transition-colors",
                      active
                        ? `${tone.border} ${tone.badgeTone}`
                        : "border-border/70 bg-background hover:border-primary/30",
                    )}
                  >
                    {t(`onboarding.lifestyle.boolean.${value ? "yes" : "no"}`)}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
