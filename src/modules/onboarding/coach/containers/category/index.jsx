import { map, filter, includes } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { cn } from "@/lib/utils";

const COACH_CATEGORIES = [
  { value: "FITNESS", label: "Fitness", emoji: "\uD83D\uDCAA", color: "bg-orange-500" },
  { value: "YOGA", label: "Yoga", emoji: "\uD83E\uDDD8", color: "bg-purple-500" },
  { value: "BOXING", label: "Boks", emoji: "\uD83E\uDD4A", color: "bg-red-500" },
  { value: "FOOTBALL", label: "Futbol", emoji: "\u26BD", color: "bg-green-500" },
  { value: "SWIMMING", label: "Suzish", emoji: "\uD83C\uDFCA", color: "bg-blue-500" },
  { value: "TENNIS", label: "Tennis", emoji: "\uD83C\uDFBE", color: "bg-yellow-500" },
  { value: "BASKETBALL", label: "Basketbol", emoji: "\uD83C\uDFC0", color: "bg-amber-500" },
  { value: "MARTIAL_ARTS", label: "Jang san'ati", emoji: "\uD83E\uDD4B", color: "bg-slate-600" },
  { value: "RUNNING", label: "Yugurish", emoji: "\uD83C\uDFC3", color: "bg-cyan-500" },
  { value: "GYMNASTICS", label: "Gimnastika", emoji: "\uD83E\uDD38", color: "bg-pink-500" },
  { value: "DANCE", label: "Raqs", emoji: "\uD83D\uDC83", color: "bg-fuchsia-500" },
  { value: "CHEERLEADING", label: "Cheerleading", emoji: "\uD83D\uDCE3", color: "bg-rose-500" },
  { value: "SKATING", label: "Muz uchish", emoji: "\u26F8\uFE0F", color: "bg-sky-500" },
  { value: "CYCLING", label: "Velosiped", emoji: "\uD83D\uDEB4", color: "bg-lime-500" },
  { value: "CLIMBING", label: "Toqqa chiqish", emoji: "\uD83E\uDDD7", color: "bg-stone-500" },
  { value: "OTHER", label: "Boshqa", emoji: "\uD83C\uDFC5", color: "bg-gray-500" },
];

const CategoryCard = ({ category, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
        selected
          ? "border-primary ring-2 ring-primary bg-primary/5"
          : "hover:bg-muted/60",
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl text-2xl text-white",
          category.color,
        )}
      >
        {category.emoji}
      </div>
      <span className="text-sm font-medium text-center leading-tight">
        {category.label}
      </span>
      {selected ? (
        <span className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-3" />
        </span>
      ) : null}
    </button>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const {
    coachCategory,
    coachCategories,
    setCoachCategory,
    toggleCoachCategory,
  } = useOnboardingStore();

  useOnboardingAutoSave("coach", "coach/category");

  const handlePrimarySelect = (value) => {
    setCoachCategory(value);
  };

  const handleAdditionalToggle = (value) => {
    if (value === coachCategory) return;
    toggleCoachCategory(value);
  };

  const handleNext = () => {
    navigate("/coach/onboarding/experience");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!coachCategory}
      onClick={handleNext}
    >
      Davom etish
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col h-full pb-20">
      <OnboardingQuestion question="Qaysi yo'nalishda murabbiylik qilasiz?" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
        {map(COACH_CATEGORIES, (category) => (
          <CategoryCard
            key={category.value}
            category={category}
            selected={coachCategory === category.value}
            onClick={() => handlePrimarySelect(category.value)}
          />
        ))}
      </div>

      {coachCategory ? (
        <div className="mt-8 w-full">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Qo'shimcha yo'nalishlar
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {map(filter(COACH_CATEGORIES, (c) => c.value !== coachCategory),
              (category) => (
                <CategoryCard
                  key={category.value}
                  category={category}
                  selected={includes(coachCategories ?? [], category.value)}
                  onClick={() => handleAdditionalToggle(category.value)}
                />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Index;
