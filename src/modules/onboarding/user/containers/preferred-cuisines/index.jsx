import OnboardingCardChipStep from "../card-chip-step.jsx";

const Index = () => (
  <OnboardingCardChipStep
    step="preferred-cuisines"
    i18nKey="onboarding.nutritionSteps.preferredCuisines"
    optionsKey="cuisines"
    field="preferredCuisineIds"
    customField="customPreferredCuisines"
    nextPath="/user/onboarding/disliked-foods"
  />
);

export default Index;
