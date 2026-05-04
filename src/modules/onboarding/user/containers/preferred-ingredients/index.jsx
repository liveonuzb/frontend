import OnboardingCardChipStep from "../card-chip-step.jsx";

const Index = () => (
  <OnboardingCardChipStep
    step="preferred-ingredients"
    i18nKey="onboarding.nutritionSteps.preferredIngredients"
    optionsKey="ingredients"
    field="preferredIngredientIds"
    customField="customPreferredIngredients"
    oppositeField="dislikedIngredientIds"
    oppositeCustomField="customDislikedIngredients"
    conflictI18nKey="onboarding.nutritionSteps.ingredients.conflict"
    nextPath="/user/onboarding/disliked-ingredients"
  />
);

export default Index;
