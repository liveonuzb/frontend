import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import { getGenderTone, ONBOARDING_TONES } from "../../lib/tones.js";
import { useOnboardingAssets } from "@/hooks/app/use-onboarding-base";
import OnboardingOption from "./option.jsx";

import { find, map } from "lodash";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { gender, setFields } = useOnboardingStore();
  const { asset, curious } = useOnboardingAssets();

  useOnboardingAutoSave("user", "gender");

  const genders = [
    {
      value: "male",
      label: t("onboarding.gender.male"),
      description: t("onboarding.gender.maleDescription"),
      image: asset("male-2"),
    },
    {
      value: "female",
      label: t("onboarding.gender.female"),
      description: t("onboarding.gender.femaleDescription"),
      image: asset("female-2"),
    },
  ];

  const selectedGender = find(genders, (item) => item.value === gender) ?? null;
  const tone = selectedGender
    ? getGenderTone(selectedGender.value)
    : ONBOARDING_TONES.neutral;
  const heroImage = selectedGender?.image ?? curious;

  const handleSelect = (value) => {
    if (value === gender) {
      return;
    }

    setFields({
      gender: value,
      healthConstraints: [],
      customHealthConstraints: [],
      injurySeverity: "",
      forbiddenExercises: [],
      medications: "",
      supplements: "",
    });
  };

  const handleContinue = () => {
    if (gender) {
      navigate("/user/onboarding/age");
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent transition-all",
        gender ? `bg-gradient-to-r ${tone.buttonTone}` : "",
      )}
      size="lg"
      disabled={!gender}
      onClick={handleContinue}
    >
      {t("onboarding.next")} <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.gender.question")} />

        <div className="relative mb-4 flex min-h-[190px] flex-1 items-end justify-center overflow-hidden md:min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroImage}
              className="flex h-full w-full items-end justify-center"
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <img
                loading="lazy"
                src={heroImage}
                alt={selectedGender?.label || t("onboarding.illustrationAlt")}
                className="h-[240px] max-h-[240px] object-contain md:max-h-[340px]"
              />
            </motion.div>
          </AnimatePresence>

          {selectedGender ? (
            <motion.div
              key={selectedGender.value}
              className={cn(
                "absolute bottom-0 rounded-[24px] border bg-background/85 px-4 py-3 text-center backdrop-blur md:rounded-[28px]",
                tone.border,
              )}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
                {t("onboarding.gender.metaLabel")}
              </p>
              <p className="text-base font-bold md:text-lg">
                {selectedGender.label}
              </p>
            </motion.div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {map(genders, (item) => {
            const isActive = gender === item.value;
            const itemTone = getGenderTone(item.value);

            return (
              <OnboardingOption
                key={item.value}
                active={isActive}
                description={item.description}
                imageAlt={item.label}
                imageClassName="h-14 w-full max-w-[104px] self-center rounded-none object-contain md:h-20 md:max-w-[136px]"
                imageFit="contain"
                imageUrl={item.image}
                onClick={() => handleSelect(item.value)}
                title={item.label}
                tone={itemTone}
                variant="image"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
