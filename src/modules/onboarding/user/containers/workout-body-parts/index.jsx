import OnboardingCardChipStep from "../card-chip-step.jsx";

const Index = () => (
  <OnboardingCardChipStep
    step="workout-body-parts"
    i18nKey="onboarding.workoutSteps.bodyParts"
    optionsKey="bodyParts"
    field="workoutBodyPartIds"
    customField="customWorkoutBodyParts"
    nextPath="/user/onboarding/preferred-exercises"
  />
);

export default Index;
