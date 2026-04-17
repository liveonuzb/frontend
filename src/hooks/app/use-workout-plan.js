import React from "react";
import { find } from "lodash";
import {
  buildWorkoutPlanPayload,
  isPersistedWorkoutPlan,
  useActivateWorkoutPlan,
  useCreateWorkoutPlan,
  useDeleteWorkoutPlan,
  usePauseWorkoutPlan,
  usePersistedWorkoutPlan,
  useUpdateWorkoutPlan,
} from "./use-workout-plans";

export const WORKOUT_PLAN_QUERY_KEY = ["user", "workout", "plans"];

export const useWorkoutPlan = (options = {}) => {
  const workoutPlanState = usePersistedWorkoutPlan(options);
  const createDraftMutation = useCreateWorkoutPlan();
  const updatePlanMutation = useUpdateWorkoutPlan();
  const activatePlanMutation = useActivateWorkoutPlan();
  const pausePlanMutation = usePauseWorkoutPlan();
  const deletePlanMutation = useDeleteWorkoutPlan();

  const isPersistedPlan = React.useCallback(
    (plan) => isPersistedWorkoutPlan(workoutPlanState.items, plan),
    [workoutPlanState.items],
  );

  const saveDraftPlan = React.useCallback(
    async (plan) => {
      return isPersistedPlan(plan)
        ? updatePlanMutation.updatePlan(plan.id, plan)
        : createDraftMutation.createPlan(plan);
    },
    [createDraftMutation, isPersistedPlan, updatePlanMutation],
  );

  const startPlan = React.useCallback(
    async (plan) => {
      if (!isPersistedPlan(plan)) {
        const createdState = await saveDraftPlan(plan);
        const latestDraft = createdState;

        if (!latestDraft?.id) {
          return createdState;
        }

        return activatePlanMutation.activatePlan(
          latestDraft.id,
          buildWorkoutPlanPayload(latestDraft),
        );
      }

      return activatePlanMutation.activatePlan(
        plan.id,
        buildWorkoutPlanPayload(plan),
      );
    },
    [activatePlanMutation, isPersistedPlan, saveDraftPlan],
  );

  const pausePlan = React.useCallback(
    async (planId) => {
      const targetPlanId = planId || workoutPlanState.activePlanId;
      if (!targetPlanId) {
        return workoutPlanState;
      }

      return pausePlanMutation.pausePlan(targetPlanId);
    },
    [pausePlanMutation, workoutPlanState],
  );

  const removePlan = React.useCallback(
    async (planId) => {
      if (!planId) {
        return workoutPlanState;
      }

      await deletePlanMutation.deletePlan(planId);
      return workoutPlanState;
    },
    [deletePlanMutation, workoutPlanState],
  );

  return {
    ...workoutPlanState,
    plans: workoutPlanState.items,
    activePlan:
      find(
        workoutPlanState.items,
        (plan) => plan.id === workoutPlanState.activePlanId,
      ) || null,
    draftPlan:
      find(
        workoutPlanState.items,
        (plan) => plan.id === workoutPlanState.draftPlanId,
      ) || null,
    templates: workoutPlanState.templates,
    saveDraftPlan,
    startPlan,
    pausePlan,
    removePlan,
    isSavingDraft:
      createDraftMutation.isPending || updatePlanMutation.isPending,
    isStartingPlan: activatePlanMutation.isPending,
    isPausingPlan: pausePlanMutation.isPending,
    isRemovingPlan: deletePlanMutation.isPending,
  };
};

export default useWorkoutPlan;
