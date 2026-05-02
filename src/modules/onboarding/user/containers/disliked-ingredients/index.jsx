import { isArray, join } from "lodash";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { usePostQuery } from "@/hooks/api";
import { getUserOnboardingPersonalizingPath } from "@/lib/app-paths";
import {
  normalizeUserOnboarding,
  toUserOnboardingPayload,
} from "@/lib/user-onboarding";
import { useAuthStore, useOnboardingStore } from "@/store";
import OnboardingComboboxChipsStep from "../combobox-chips-step.jsx";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resetOnboardingStore = useOnboardingStore((state) => state.reset);
  const { initializeUser, setOnboardingCompleted, setOnboardingFlow, user } =
    useAuthStore();

  const { mutateAsync: completeOnboarding, isPending } = usePostQuery({
    mutationProps: {
      onSuccess: async (_data, variables) => {
        const body = _data?.data?.data ?? _data?.data ?? {};
        const personalizationJobId =
          body?.personalizationJobId ?? body?.personalizationJob?.id;
        const flowPayload = {
          onboardingFlowStatus:
            body?.onboardingFlowStatus ??
            body?.personalizationJob?.flowStatus ??
            "PERSONALIZING",
          onboardingNextPath:
            body?.onboardingNextPath ?? body?.personalizationJob?.nextPath,
          latestPersonalizationJobId: personalizationJobId,
        };
        const nextOnboarding = normalizeUserOnboarding(variables?.attributes);
        const nextUser = user
          ? {
              ...user,
              onboardingCompleted: true,
              ...flowPayload,
              onboarding: nextOnboarding,
            }
          : user;

        setOnboardingCompleted(true);
        setOnboardingFlow(flowPayload);

        if (nextUser) {
          initializeUser(nextUser);
          queryClient.setQueryData(["me"], { data: nextUser });
        }

        await queryClient.invalidateQueries({ queryKey: ["me"] });
        resetOnboardingStore();
        navigate(
          body?.onboardingNextPath ??
            getUserOnboardingPersonalizingPath(personalizationJobId),
          { replace: true },
        );
      },
      onError: (error) => {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || t("onboarding.dietRestrictions.error"),
        );
      },
    },
  });

  const handleComplete = React.useCallback(async () => {
    const state = useOnboardingStore.getState();
    const payload = {
      ...toUserOnboardingPayload({
        firstName: state.firstName,
        lastName: state.lastName,
        gender: state.gender,
        age: state.age,
        height: state.height,
        currentWeight: state.currentWeight,
        goal: state.goal,
        weightGoal: state.weightGoal,
        goals: state.goals,
        targetWeight: state.targetWeight,
        weeklyPace: state.weeklyPace,
        activityLevel: state.activityLevel,
        mealFrequency: state.mealFrequency,
        waterHabits: state.waterHabits,
        foodBudget: state.foodBudget,
        budgetPeriod: state.budgetPeriod,
        budgetCurrency: state.budgetCurrency,
        workoutLocation: state.workoutLocation,
        equipmentIds: state.equipmentIds,
        customEquipment: state.customEquipment,
        workoutBodyPartIds: state.workoutBodyPartIds,
        customWorkoutBodyParts: state.customWorkoutBodyParts,
        preferredExerciseIds: state.preferredExerciseIds,
        dislikedExerciseIds: state.dislikedExerciseIds,
        customPreferredExercises: state.customPreferredExercises,
        customDislikedExercises: state.customDislikedExercises,
        allergyIds: state.allergyIds?.length
          ? state.allergyIds
          : state.allergyIngredientIds,
        allergyIngredientIds: state.allergyIngredientIds,
        customAllergies: state.customAllergies,
        dietRequirementIds: state.dietRequirementIds,
        customDietRequirements: state.customDietRequirements,
        dislikedFoodIds: state.dislikedFoodIds,
        customDislikedFoods: state.customDislikedFoods,
        preferredIngredientIds: state.preferredIngredientIds,
        customPreferredIngredients: state.customPreferredIngredients,
        dislikedIngredientIds: state.dislikedIngredientIds,
        customDislikedIngredients: state.customDislikedIngredients,
        nutritionPreferenceKeys: state.nutritionPreferenceKeys,
        healthConstraints: state.healthConstraints,
        dietRestrictions: state.dietRestrictions,
      }),
      completed: true,
    };

    await completeOnboarding({
      url: "/onboarding/complete",
      attributes: payload,
    });
  }, [completeOnboarding]);

  return (
    <OnboardingComboboxChipsStep
      step="disliked-ingredients"
      i18nKey="onboarding.nutritionSteps.dislikedIngredients"
      optionsKey="ingredients"
      field="dislikedIngredientIds"
      customField="customDislikedIngredients"
      oppositeField="preferredIngredientIds"
      oppositeCustomField="customPreferredIngredients"
      conflictI18nKey="onboarding.nutritionSteps.ingredients.conflict"
      nextPath="/user/onboarding/personalizing"
      onNext={handleComplete}
      isPending={isPending}
      nextLabel={t("onboarding.finish")}
    />
  );
};

export default Index;
