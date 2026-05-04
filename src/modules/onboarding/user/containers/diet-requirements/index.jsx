import OnboardingCardChipStep from "../card-chip-step.jsx";

const Index = () => (
  <OnboardingCardChipStep
    step="diet-requirements"
    i18nKey="onboarding.nutritionSteps.dietRequirements"
    optionsKey="dietRequirements"
    field="dietRequirementIds"
    customField="customDietRequirements"
    nextPath="/user/onboarding/preferred-cuisines"
  />
);

export default Index;
