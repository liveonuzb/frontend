import OnboardingComboboxChipsStep from "../combobox-chips-step.jsx";

const Index = () => (
  <OnboardingComboboxChipsStep
    step="workout-body-parts"
    i18nKey="onboarding.workoutSteps.bodyParts"
    optionsKey="bodyParts"
    field="workoutBodyPartIds"
    customField="customWorkoutBodyParts"
    nextPath="/user/onboarding/preferred-exercises"
  />
);

export default Index;
