import OnboardingCardChipStep from "../card-chip-step.jsx";

const Index = () => (
  <OnboardingCardChipStep
    step="disliked-exercises"
    i18nKey="onboarding.workoutSteps.dislikedExercises"
    optionsKey="exercises"
    field="dislikedExerciseIds"
    customField="customDislikedExercises"
    oppositeField="preferredExerciseIds"
    oppositeCustomField="customPreferredExercises"
    conflictI18nKey="onboarding.workoutSteps.exercises.conflict"
    nextPath="/user/onboarding/meal-frequency"
  />
);

export default Index;
