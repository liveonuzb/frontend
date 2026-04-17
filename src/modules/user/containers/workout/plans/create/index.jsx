import React from "react";
import { get, trim } from "lodash";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import WorkoutPlanFormDrawer from "../../workout-plan-form-drawer.jsx";
import {
  useCreateWorkoutPlan,
} from "@/hooks/app/use-workout-plans";
import {
  buildWorkoutPlanMetaPayload,
  buildWorkoutPlanSearch,
  WORKOUT_PLAN_BUILDER_STEP,
} from "../../workout-plan-flow.js";

const CreateWorkoutPlanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const createPlanMutation = useCreateWorkoutPlan();
  const initialPlan = get(location, "state.initialPlan", null);
  const [metaName, setMetaName] = React.useState(get(initialPlan, "name", ""));
  const [metaDescription, setMetaDescription] = React.useState(
    get(initialPlan, "description", ""),
  );

  React.useEffect(() => {
    setMetaName(get(initialPlan, "name", ""));
    setMetaDescription(get(initialPlan, "description", ""));
  }, [initialPlan]);

  const closeRoute = React.useCallback(() => {
    navigate(
      {
        pathname: "/user/workout",
        search: buildWorkoutPlanSearch(location.search, null),
      },
      { replace: true },
    );
  }, [location.search, navigate]);

  const handleMetaSubmit = React.useCallback(async () => {
    const normalizedName = trim(metaName);

    if (!normalizedName) {
      toast.error("Reja nomini kiriting");
      return;
    }

    const createdPlan = await createPlanMutation.createPlan(
      buildWorkoutPlanMetaPayload({
        basePlan: initialPlan,
        name: normalizedName,
        description: metaDescription,
      }),
    );

    if (!createdPlan?.id) {
      return;
    }

    navigate(
      {
        pathname: `/user/workout/plans/edit/${createdPlan.id}`,
        search: buildWorkoutPlanSearch(
          location.search,
          WORKOUT_PLAN_BUILDER_STEP,
        ),
      },
      {
        replace: true,
        state: {
          initialPlan: createdPlan,
          shouldActivateOnSave: true,
        },
      },
    );
  }, [createPlanMutation, initialPlan, location.search, metaDescription, metaName, navigate]);

  return (
    <WorkoutPlanFormDrawer
      open
      mode="create"
      view="meta"
      isSaving={createPlanMutation.isPending}
      metaName={metaName}
      metaDescription={metaDescription}
      onMetaNameChange={setMetaName}
      onMetaDescriptionChange={setMetaDescription}
      onMetaSubmit={handleMetaSubmit}
      onOpenChange={(open) => {
        if (!open) {
          closeRoute();
        }
      }}
    />
  );
};

export default CreateWorkoutPlanPage;
