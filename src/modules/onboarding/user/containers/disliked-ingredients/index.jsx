import React from "react";
import { useTranslation } from "react-i18next";
import OnboardingCardChipStep from "../card-chip-step.jsx";

const Index = () => {
  const { t } = useTranslation();

  return (
    <OnboardingCardChipStep
      step="disliked-ingredients"
      i18nKey="onboarding.nutritionSteps.dislikedIngredients"
      optionsKey="ingredients"
      field="dislikedIngredientIds"
      customField="customDislikedIngredients"
      oppositeField="preferredIngredientIds"
      oppositeCustomField="customPreferredIngredients"
      conflictI18nKey="onboarding.nutritionSteps.ingredients.conflict"
      nextPath="/user/onboarding/review"
      nextLabel={t("onboarding.next")}
    />
  );
};

export default Index;
