import { filter, includes, isArray , map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { Globe2Icon, LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store";
import useAppLanguages from "@/hooks/app/use-app-languages";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const Index = () => {
  const navigate = useNavigate();
  const { coachLanguages, setField } = useOnboardingStore();
  const { languages } = useAppLanguages();

  useOnboardingAutoSave("coach", "coach/languages");

  const selectedLanguages = isArray(coachLanguages) ? coachLanguages : [];
  const activeLanguages = filter(
    languages ?? [],
    (language) => language.isActive !== false,
  );

  const toggleLanguage = React.useCallback(
    (languageCode) => {
      const hasLanguage = includes(selectedLanguages, languageCode);
      const next = hasLanguage
        ? filter(selectedLanguages, (code) => code !== languageCode)
        : [...selectedLanguages, languageCode];
      setField("coachLanguages", next);
    },
    [selectedLanguages, setField],
  );

  const handleNext = () => {
    navigate("/coach/onboarding/avatar");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      onClick={handleNext}
    >
      {selectedLanguages.length > 0 ? "Davom etish" : "O'tkazib yuborish"}
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="Qaysi tillarda ishlaysiz?" />

      <div className="space-y-6 w-full">
        <div className="rounded-3xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap gap-2">
            {map(activeLanguages, (language) => {
              const code = language.code;
              const selected = includes(selectedLanguages, code);
              return (
                <Button
                  key={code}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  className="rounded-full h-10 px-4"
                  onClick={() => toggleLanguage(code)}
                >
                  {language.flag ? `${language.flag} ` : ""}
                  {language.name}
                </Button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Kamida bitta til tanlang.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-3xl border border-border/50">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-background shrink-0 shadow-sm">
            <LanguagesIcon className="size-5 text-primary" />
          </div>
          <div className="space-y-1 text-left">
            <div className="font-bold text-sm">Ko&apos;proq userga chiqing</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tillar bo&apos;yicha filter ishlaydi, mos userlar profilingizni
              tezroq topadi.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-3xl border border-border/50">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-background shrink-0 shadow-sm">
            <Globe2Icon className="size-5 text-primary" />
          </div>
          <div className="space-y-1 text-left">
            <div className="font-bold text-sm">Marketplace uchun signal</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To&apos;g&apos;ri til tanlovi sizning ko&apos;rinishingizni
              oshiradi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
