import OnboardingComboboxChipsStep from "../combobox-chips-step.jsx";

const Index = () => (
  <OnboardingComboboxChipsStep
    step="preferred-exercises"
    i18nKey="onboarding.workoutSteps.preferredExercises"
    optionsKey="exercises"
    field="preferredExerciseIds"
    customField="customPreferredExercises"
    oppositeField="dislikedExerciseIds"
    oppositeCustomField="customDislikedExercises"
    conflictI18nKey="onboarding.workoutSteps.exercises.conflict"
    nextPath="/user/onboarding/disliked-exercises"
  />
);

export default Index;
