import OnboardingComboboxChipsStep from "../combobox-chips-step.jsx";

const Index = () => (
  <OnboardingComboboxChipsStep
    step="workout-equipment"
    i18nKey="onboarding.workoutSteps.equipment"
    optionsKey="equipment"
    field="equipmentIds"
    customField="customEquipment"
    nextPath="/user/onboarding/workout-body-parts"
  />
);

export default Index;
