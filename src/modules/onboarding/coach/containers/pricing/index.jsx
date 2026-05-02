import { map } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const WORK_MODE_OPTIONS = [
  { value: "online", i18nKey: "online", icon: "\uD83C\uDF10" },
  { value: "offline", i18nKey: "offline", icon: "\uD83C\uDFE2" },
  { value: "hybrid", i18nKey: "hybrid", icon: "\u26A1\uFE0F" },
];

const Index = () => {
  const { t } = useTranslation();
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
      {isFormValid ? t("onboarding.coach.common.continue") : t("onboarding.skip")}
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col h-full pb-4">
      <OnboardingQuestion question={t("onboarding.coach.pricing.question")} />

      <div className="flex flex-col gap-5 w-full">
        {/* Work mode -- ToggleGroup */}
        <Field>
          <FieldLabel>{t("onboarding.coach.pricing.workModeLabel")}</FieldLabel>
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
                {option.icon} {t(`onboarding.coach.pricing.workModes.${option.i18nKey}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        {/* Price range inputs */}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>{t("onboarding.coach.pricing.minPriceLabel")}</FieldLabel>
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
            <FieldLabel>{t("onboarding.coach.pricing.maxPriceLabel")}</FieldLabel>
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
          <FieldLabel>{t("onboarding.coach.pricing.cityLabel")}</FieldLabel>
          <Input
            value={coachCity}
            placeholder="Toshkent"
            onChange={(event) => setField("coachCity", event.target.value)}
          />
        </Field>

        {/* Workplace */}
        <Field>
          <FieldLabel>{t("onboarding.coach.pricing.workplaceLabel")}</FieldLabel>
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
