import OnboardingCardChipStep from "../card-chip-step.jsx";

const Index = () => (
  <OnboardingCardChipStep
    step="allergies"
    i18nKey="onboarding.nutritionSteps.allergies"
    optionsKey="allergies"
    field="allergyIds"
    legacyField="allergyIngredientIds"
    customField="customAllergies"
    nextPath="/user/onboarding/diet-requirements"
  />
);

export default Index;
