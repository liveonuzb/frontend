import { times } from "lodash";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { ScrollPicker } from "@/components/ui/scroll-picker";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import { getOnboardingPersonIllustration } from "../../lib/illustration.js";
import { getAgeTone } from "../../lib/tones.js";

const ageItems = times(120 - 13 + 1, (i) => ({
  value: String(i + 13),
  label: String(i + 13),
}));

const getAgeProfile = (ageValue) => {
  const ageNumber = Number(ageValue);

  if (!Number.isFinite(ageNumber) || ageNumber <= 24) {
    return {
      title: "Young energy",
      note: "We can push a bit more on pace and recovery.",
    };
  }

  if (ageNumber >= 50) {
    return {
      title: "Mature rhythm",
      note: "Consistency and recovery will matter more.",
    };
  }

  return {
    title: "Balanced phase",
    note: "Your plan will blend progress with sustainable habits.",
  };
};

const Index = () => {
  const navigate = useNavigate();
  const { age, setField, gender, firstName } = useOnboardingStore();

  useOnboardingAutoSave("user", "age");

  const currentAge = age || "26";
  const illustration = getOnboardingPersonIllustration(gender, currentAge);
  const tone = getAgeTone(currentAge);
  const profile = getAgeProfile(currentAge);

  const handleContinue = () => {
    setField("age", currentAge);
    navigate("/user/onboarding/height");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      size="lg"
      onClick={handleContinue}
    >
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden pt-3 md:pt-8  px-5">
      <PageAura tone={tone} />
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={
            firstName ? `${firstName} how old are you?` : "What's your age?"
          }
        />
        <motion.div
          // key={`age-profile-${currentAge}`}
          className={cn(
            "mx-auto max-w-[180px] rounded-[24px] border bg-background/85 px-4 py-3 text-center backdrop-blur w-[220px] md:max-w-[220px]",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:text-xs">
            Age
          </p>
          <p className="mt-1 text-base font-bold md:text-lg">{profile.title}</p>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            {currentAge} years old
          </p>
        </motion.div>

        <div className="flex w-full items-end justify-center gap-4 md:gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={illustration.src}
              className="flex min-h-[350px] flex-1 items-end justify-center md:min-h-[360px]"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <img
                src={illustration.src}
                className="max-h-[340px] w-full max-w-[320px] object-contain md:max-h-[340px] md:max-w-[320px]"
                alt={illustration.alt}
              />
            </motion.div>
          </AnimatePresence>
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div
              className={cn(
                "rounded-[30px] border bg-background/80 px-1 py-2 backdrop-blur",
                tone.border,
              )}
            >
              <div className="w-[88px] md:w-[96px]">
                <ScrollPicker
                  items={ageItems}
                  value={currentAge}
                  onChange={(val) => setField("age", val)}
                  itemHeight={56}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
