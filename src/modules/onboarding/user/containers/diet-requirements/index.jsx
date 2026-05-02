import OnboardingComboboxChipsStep from "../combobox-chips-step.jsx";

const Index = () => (
  <OnboardingComboboxChipsStep
    step="diet-requirements"
    i18nKey="onboarding.nutritionSteps.dietRequirements"
    optionsKey="dietRequirements"
    field="dietRequirementIds"
    customField="customDietRequirements"
    nextPath="/user/onboarding/disliked-foods"
  />
);

export default Index;
