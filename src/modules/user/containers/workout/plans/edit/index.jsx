import React from "react";
import { get, trim } from "lodash";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { toast } from "sonner";
import WorkoutPlanFormDrawer from "../../workout-plan-form-drawer.jsx";
import {
  useActivateWorkoutPlan,
  useUpdateWorkoutPlan,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import {
  buildWorkoutPlanMetaPayload,
  buildWorkoutPlanSearch,
  normalizeWorkoutPlanStep,
  resolveWorkoutPlanRouteState,
  WORKOUT_PLAN_BUILDER_STEP,
} from "../../workout-plan-flow.js";

const EditWorkoutPlanPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeState = React.useMemo(
    () => resolveWorkoutPlanRouteState(location.state),
    [location.state],
  );
  const updatePlanMutation = useUpdateWorkoutPlan();
  const activatePlanMutation = useActivateWorkoutPlan();
  const {
    plan,
    isLoading,
    isError,
    refetch,
  } = useWorkoutPlanDetail(planId, {
    enabled: Boolean(planId),
  });
  const requestedStep = searchParams.get("step");
  const normalizedStep = normalizeWorkoutPlanStep(requestedStep);
  const effectivePlan = plan || routeState.initialPlan;
  const [metaName, setMetaName] = React.useState(get(effectivePlan, "name", ""));
  const [metaDescription, setMetaDescription] = React.useState(
    get(effectivePlan, "description", ""),
  );
  const flowMode = routeState.shouldActivateOnSave ? "create" : "edit";
  const isBuilderView = normalizedStep === WORKOUT_PLAN_BUILDER_STEP;

  React.useEffect(() => {
    if (requestedStep && !normalizedStep) {
      navigate(
        {
          pathname: location.pathname,
          search: buildWorkoutPlanSearch(location.search, null),
        },
        {
          replace: true,
          state: location.state,
        },
      );
    }
  }, [location.pathname, location.search, location.state, navigate, normalizedStep, requestedStep]);

  React.useEffect(() => {
    setMetaName(get(effectivePlan, "name", ""));
    setMetaDescription(get(effectivePlan, "description", ""));
  }, [
    effectivePlan?.id,
    effectivePlan?.name,
    effectivePlan?.description,
  ]);

  const closeRoute = React.useCallback(() => {
    navigate(
      {
        pathname: "/user/workout",
        search: buildWorkoutPlanSearch(location.search, null),
      },
      { replace: true },
    );
  }, [location.search, navigate]);

  const navigateToMeta = React.useCallback(
    (nextPlan = effectivePlan) => {
      navigate(
        {
          pathname: location.pathname,
          search: buildWorkoutPlanSearch(location.search, null),
        },
        {
          replace: true,
          state: {
            initialPlan: nextPlan,
            shouldActivateOnSave: routeState.shouldActivateOnSave,
          },
        },
      );
    },
    [effectivePlan, location.pathname, location.search, navigate, routeState.shouldActivateOnSave],
  );

  const navigateToBuilder = React.useCallback(
    (nextPlan = effectivePlan) => {
      navigate(
        {
          pathname: location.pathname,
          search: buildWorkoutPlanSearch(
            location.search,
            WORKOUT_PLAN_BUILDER_STEP,
          ),
        },
        {
          replace: true,
          state: {
            initialPlan: nextPlan,
            shouldActivateOnSave: routeState.shouldActivateOnSave,
          },
        },
      );
    },
    [effectivePlan, location.pathname, location.search, navigate, routeState.shouldActivateOnSave],
  );

  const handleMetaSubmit = React.useCallback(async () => {
    const normalizedName = trim(metaName);

    if (!normalizedName) {
      toast.error("Reja nomini kiriting");
      return;
    }

    const updatedPlan = await updatePlanMutation.updatePlan(
      planId,
      buildWorkoutPlanMetaPayload({
        basePlan: effectivePlan,
        name: normalizedName,
        description: metaDescription,
      }),
    );

    navigateToBuilder(updatedPlan);
  }, [effectivePlan, metaDescription, metaName, navigateToBuilder, planId, updatePlanMutation]);

  const handleBuilderSave = React.useCallback(
    async (nextPlan) => {
      const updatedPlan = await updatePlanMutation.updatePlan(planId, nextPlan);

      if (routeState.shouldActivateOnSave) {
        await activatePlanMutation.activatePlan(planId, updatedPlan);
      }

      toast.success(
        routeState.shouldActivateOnSave
          ? `"${get(updatedPlan, "name", get(nextPlan, "name", "Workout reja"))}" yaratildi`
          : `"${get(updatedPlan, "name", get(nextPlan, "name", "Workout reja"))}" yangilandi`,
      );
      closeRoute();
    },
    [
      activatePlanMutation,
      closeRoute,
      planId,
      routeState.shouldActivateOnSave,
      updatePlanMutation,
    ],
  );

  return (
    <WorkoutPlanFormDrawer
      open
      mode={flowMode}
      view={isBuilderView ? "builder" : "meta"}
      initialPlan={effectivePlan}
      isLoading={isLoading && !effectivePlan}
      isError={isError || (!isLoading && !effectivePlan)}
      isSaving={updatePlanMutation.isPending || activatePlanMutation.isPending}
      metaName={metaName}
      metaDescription={metaDescription}
      onMetaNameChange={setMetaName}
      onMetaDescriptionChange={setMetaDescription}
      onMetaSubmit={handleMetaSubmit}
      onBuilderSave={handleBuilderSave}
      onBuilderBack={() => navigateToMeta()}
      onRetry={() => refetch()}
      onOpenChange={(open) => {
        if (!open) {
          closeRoute();
        }
      }}
    />
  );
};

export default EditWorkoutPlanPage;
