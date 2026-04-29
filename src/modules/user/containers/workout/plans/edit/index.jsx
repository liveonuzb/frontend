import React from "react";
import { get, trim } from "lodash";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import WorkoutPlanBuilder from "@/components/workout-plan-builder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useActivateWorkoutPlan,
  useUpdateWorkoutPlan,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import { useBreadcrumbStore } from "@/store";
import { resolveWorkoutPlanRouteState } from "../../workout-plan-flow";

const EditWorkoutPlanPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const routeState = React.useMemo(
    () => resolveWorkoutPlanRouteState(location.state),
    [location.state],
  );
  const initialSelectedDayIndex = React.useMemo(() => {
    const query = new URLSearchParams(location.search);
    const rawDay = query.get("day");
    if (rawDay === null) {
      return null;
    }

    const rawValue = Number(rawDay);
    return Number.isInteger(rawValue) && rawValue >= 0 ? rawValue : null;
  }, [location.search]);
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
  const effectivePlan = plan || routeState.initialPlan;
  const [metaName, setMetaName] = React.useState(get(effectivePlan, "name", ""));
  const [metaDescription, setMetaDescription] = React.useState(
    get(effectivePlan, "description", ""),
  );
  const isSaving = updatePlanMutation.isPending || activatePlanMutation.isPending;
  const isCreatedDraft = Boolean(routeState.shouldActivateOnSave);
  const isMetaDirty =
    trim(metaName) !== trim(get(effectivePlan, "name", "")) ||
    trim(metaDescription) !== trim(get(effectivePlan, "description", ""));

  React.useEffect(() => {
    setMetaName(get(effectivePlan, "name", ""));
    setMetaDescription(get(effectivePlan, "description", ""));
  }, [
    effectivePlan?.id,
    effectivePlan?.name,
    effectivePlan?.description,
  ]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/plans", title: "Mening rejalarim" },
      {
        url: `/user/workout/plans/edit/${planId}`,
        title: get(effectivePlan, "name", "Rejani tahrirlash"),
      },
    ]);
  }, [effectivePlan, planId, setBreadcrumbs]);

  React.useEffect(() => {
    if (!isMetaDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isMetaDirty]);

  const handleBack = React.useCallback(() => {
    navigate(
      isCreatedDraft || !get(effectivePlan, "id")
        ? "/user/workout/plans"
        : `/user/workout/plans/${get(effectivePlan, "id")}`,
    );
  }, [effectivePlan, isCreatedDraft, navigate]);

  const handleBuilderSave = React.useCallback(
    async (nextPlan) => {
      const normalizedName = trim(metaName);

      if (!normalizedName) {
        toast.error("Reja nomini kiriting");
        return;
      }

      const updatedPlan = await updatePlanMutation.updatePlan(planId, {
        ...nextPlan,
        name: normalizedName,
        description: metaDescription,
      });

      if (isCreatedDraft) {
        await activatePlanMutation.activatePlan(planId, updatedPlan);
      }

      toast.success(
        isCreatedDraft
          ? `"${get(updatedPlan, "name", "Workout reja")}" yaratildi`
          : `"${get(updatedPlan, "name", "Workout reja")}" yangilandi`,
      );
      navigate(`/user/workout/plans/${planId}`, { replace: true });
    },
    [
      activatePlanMutation,
      isCreatedDraft,
      metaDescription,
      metaName,
      navigate,
      planId,
      updatePlanMutation,
    ],
  );

  if (isLoading && !effectivePlan) {
    return <PageLoader />;
  }

  if (isError || !effectivePlan) {
    return (
      <PageTransition mode="slide-up">
        <Card>
          <CardHeader>
            <CardTitle>Workout reja topilmadi</CardTitle>
            <CardDescription>
              Reja o'chirilgan yoki sizda unga ruxsat yo'q.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-2">
            <Button onClick={() => refetch()}>Qayta urinish</Button>
            <Button variant="outline" onClick={() => navigate("/user/workout/plans")}>
              Rejalarga qaytish
            </Button>
          </CardFooter>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="min-h-[60svh]">
        <WorkoutPlanBuilder
          open
          onOpenChange={(open) => {
            if (!open) {
              handleBack();
            }
          }}
          initialPlan={effectivePlan}
          onSave={handleBuilderSave}
          onClose={handleBack}
          metaName={metaName}
          metaDescription={metaDescription}
          onMetaSave={({ name, description }) => {
            setMetaName(name);
            setMetaDescription(description);
          }}
          initialSelectedDayIndex={initialSelectedDayIndex}
          isSaving={isSaving}
          submitLabel={isSaving ? "Saqlanmoqda..." : "Saqlash"}
          title={metaName || get(effectivePlan, "name") || "Workout plan builder"}
          description="Tahrirlash rejimi"
        />
      </div>
    </PageTransition>
  );
};

export default EditWorkoutPlanPage;
