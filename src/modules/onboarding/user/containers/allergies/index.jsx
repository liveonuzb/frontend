import OnboardingComboboxChipsStep from "../combobox-chips-step.jsx";

const Index = () => (
  <OnboardingComboboxChipsStep
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
