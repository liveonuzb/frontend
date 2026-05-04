import OnboardingCardChipStep from "../card-chip-step.jsx";

const Index = () => (
  <OnboardingCardChipStep
    step="disliked-foods"
    i18nKey="onboarding.nutritionSteps.dislikedFoods"
    optionsKey="foods"
    field="dislikedFoodIds"
    customField="customDislikedFoods"
    nextPath="/user/onboarding/preferred-ingredients"
  />
);

export default Index;
