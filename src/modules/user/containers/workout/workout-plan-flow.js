import { get, trim } from "lodash";
import { buildWorkoutPlanPayload } from "@/hooks/app/use-workout-plans";

export const WORKOUT_PLAN_BUILDER_STEP = "builder";

export const normalizeWorkoutPlanStep = (step) =>
  step === WORKOUT_PLAN_BUILDER_STEP ? WORKOUT_PLAN_BUILDER_STEP : null;

export const buildWorkoutPlanSearch = (search = "", step = null) => {
  const params = new URLSearchParams(search);

  if (step === WORKOUT_PLAN_BUILDER_STEP) {
    params.set("step", WORKOUT_PLAN_BUILDER_STEP);
  } else {
    params.delete("step");
  }

  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : "";
};

export const buildWorkoutPlanMetaPayload = ({
  basePlan = null,
  name = "",
  description = "",
}) => {
  const payload = {
    ...buildWorkoutPlanPayload(basePlan || {}),
    name: trim(String(name || "")),
    description: trim(String(description || "")),
  };

  if (!Array.isArray(payload.schedule)) {
    payload.schedule = [];
  }

  return payload;
};

export const resolveWorkoutPlanRouteState = (state = {}) => ({
  initialPlan: get(state, "initialPlan", null),
  shouldActivateOnSave: Boolean(get(state, "shouldActivateOnSave")),
});
