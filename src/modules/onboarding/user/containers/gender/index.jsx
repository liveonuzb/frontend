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
import PageAura from "../../components/page-aura.jsx";
import { getGenderTone, ONBOARDING_TONES } from "../../lib/tones.js";

const genders = [
  {
    value: "male",
    label: "Moto moto",
    description: "Masculine plan visuals and body guidance.",
    image: "/onboarding/male-2.png",
  },
  {
    value: "female",
    label: "Gloria",
    description: "Feminine plan visuals and body guidance.",
    image: "/onboarding/female-2.png",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { gender, setField } = useOnboardingStore();

  useOnboardingAutoSave("user", "gender");

  const selectedGender = genders.find((item) => item.value === gender) ?? null;
  const tone = selectedGender
    ? getGenderTone(selectedGender.value)
    : ONBOARDING_TONES.neutral;
  const heroImage = selectedGender?.image ?? "/onboarding/curious.png";

  const handleSelect = (value) => {
    setField("gender", value);
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
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden pt-3 md:pt-8  px-5">
      <PageAura tone={tone} />

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question="What's your gender?" />

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
                src={heroImage}
                alt={selectedGender?.label || "Onboarding illustration"}
                className="max-h-[240px] object-contain md:max-h-[340px]"
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
                Gender
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
                  "relative flex flex-col items-center gap-3 rounded-[28px] border px-4 py-4 transition-all",
                  isActive
                    ? `bg-gradient-to-br ${itemTone.cardTone} ${itemTone.border}`
                    : "border-border/70 bg-background/90 hover:border-primary/30",
                )}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src={item.image}
                  alt={item.label}
                  className="h-24 object-contain md:h-44"
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
