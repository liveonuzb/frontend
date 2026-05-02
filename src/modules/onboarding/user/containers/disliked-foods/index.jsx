import OnboardingComboboxChipsStep from "../combobox-chips-step.jsx";

const Index = () => (
  <OnboardingComboboxChipsStep
    step="disliked-foods"
    i18nKey="onboarding.nutritionSteps.dislikedFoods"
    optionsKey="foods"
    field="dislikedFoodIds"
    customField="customDislikedFoods"
    nextPath="/user/onboarding/preferred-ingredients"
  />
);

export default Index;
