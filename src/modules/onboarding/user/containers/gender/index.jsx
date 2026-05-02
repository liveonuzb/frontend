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
import PageAura from "../../components/page-aura.jsx";
import { getGenderTone, ONBOARDING_TONES } from "../../lib/tones.js";
import useAppModeTheme from "@/hooks/app/use-app-mode-theme";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { gender, setField } = useOnboardingStore();
  const modeTheme = useAppModeTheme();
  const base = modeTheme.assets.onboardingBase;

  useOnboardingAutoSave("user", "gender");

  const genders = [
    {
      value: "male",
      label: t("onboarding.gender.male"),
      description: t("onboarding.gender.maleDescription"),
      image: `${base}/male-2.webp`,
    },
    {
      value: "female",
      label: t("onboarding.gender.female"),
      description: t("onboarding.gender.femaleDescription"),
      image: `${base}/female-2.webp`,
    },
  ];

  const selectedGender = genders.find((item) => item.value === gender) ?? null;
  const tone = selectedGender
    ? getGenderTone(selectedGender.value)
    : ONBOARDING_TONES.neutral;
  const heroImage = selectedGender?.image ?? modeTheme.assets.curious;

  const handleSelect = (value) => {
    if (value !== gender) {
      setField("healthConstraints", []);
    }
    setField("gender", value);
  };

  const handleContinue = () => {
    if (gender) {
      navigate("/user/onboarding/health-constraints");
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
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden pt-3 md:pt-8  px-5">
      <PageAura tone={tone} />

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.gender.question")} />

        <div className="relative mb-4 flex min-h-[220px] items-end justify-center overflow-hidden md:min-h-[320px]">
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
              <motion.button
                key={item.value}
                type="button"
                onClick={() => handleSelect(item.value)}
                className={cn(
                  "relative flex flex-col items-center rounded-[28px] border px-4 py-4 transition-all",
                  isActive
                    ? `bg-gradient-to-br ${itemTone.cardTone} ${itemTone.border}`
                    : "border-border/70 bg-background/90 hover:border-primary/30",
                )}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  loading="lazy"
                  src={item.image}
                  alt={item.label}
                  className="h-24 object-contain md:h-40"
                />
                <div className="text-center">
                  <span className="text-base font-bold">{item.label}</span>
                  <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                    {item.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 md:size-6",
                    isActive
                      ? `${itemTone.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  <div
                    className={cn(
                      "size-3 rounded-full transition-all",
                      isActive ? itemTone.dotTone : "scale-0 opacity-0",
                    )}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
