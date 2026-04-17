import { map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const WORK_MODE_OPTIONS = [
  { value: "online", label: "\uD83C\uDF10 Online" },
  { value: "offline", label: "\uD83C\uDFE2 Offline" },
  { value: "hybrid", label: "\u26A1\uFE0F Hybrid" },
];

const Index = () => {
  const navigate = useNavigate();
  const {
    coachCity,
    coachWorkMode,
    coachWorkplace,
    coachMinMonthlyPrice,
    coachMaxMonthlyPrice,
    setField,
  } = useOnboardingStore();

  useOnboardingAutoSave("coach", "coach/pricing");

  const isFormValid =
    coachCity.trim().length > 1 &&
    coachWorkMode.trim().length > 0 &&
    coachWorkplace.trim().length > 1;

  const handleNext = () => navigate("/coach/onboarding/languages");

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      onClick={handleNext}
    >
      {isFormValid ? "Davom etish" : "O'tkazib yuborish"}
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col h-full pb-4">
      <OnboardingQuestion question="Narx va ish uslubingizni belgilang" />

      <div className="flex flex-col gap-5 w-full">
        {/* Work mode -- ToggleGroup */}
        <Field>
          <FieldLabel>Ishlash formati</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={coachWorkMode}
            onValueChange={(value) => value && setField("coachWorkMode", value)}
            className="w-full"
            spacing={0}
          >
            {map(WORK_MODE_OPTIONS, (option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="flex-1"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        {/* Price range inputs */}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Minimal narx (oyiga)</FieldLabel>
            <Input
              type="number"
              value={coachMinMonthlyPrice}
              onChange={(e) =>
                setField("coachMinMonthlyPrice", Number(e.target.value))
              }
              placeholder="200 000"
            />
          </Field>
          <Field>
            <FieldLabel>Maksimal narx (oyiga)</FieldLabel>
            <Input
              type="number"
              value={coachMaxMonthlyPrice}
              onChange={(e) =>
                setField("coachMaxMonthlyPrice", Number(e.target.value))
              }
              placeholder="500 000"
            />
          </Field>
        </div>

        {/* City */}
        <Field>
          <FieldLabel>Shahar</FieldLabel>
          <Input
            value={coachCity}
            placeholder="Toshkent"
            onChange={(event) => setField("coachCity", event.target.value)}
          />
        </Field>

        {/* Workplace */}
        <Field>
          <FieldLabel>Ish joyi</FieldLabel>
          <Input
            value={coachWorkplace}
            placeholder="FitLife Studio"
            onChange={(event) => setField("coachWorkplace", event.target.value)}
          />
        </Field>
      </div>
    </div>
  );
};

export default Index;
