import React from "react";
import { get, trim } from "lodash";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  SaveIcon,
} from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import WorkoutPlanBuilder from "@/components/workout-plan-builder";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useActivateWorkoutPlan,
  useUpdateWorkoutPlan,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import { useBreadcrumbStore } from "@/store";
import {
  buildWorkoutPlanMetaPayload,
  resolveWorkoutPlanRouteState,
} from "../../workout-plan-flow";

const EditWorkoutPlanPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbStore();
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

  const handleMetaSave = React.useCallback(async () => {
    const normalizedName = trim(metaName);

    if (!normalizedName) {
      toast.error("Reja nomini kiriting");
      return null;
    }

    const updatedPlan = await updatePlanMutation.updatePlan(
      planId,
      buildWorkoutPlanMetaPayload({
        basePlan: effectivePlan,
        name: normalizedName,
        description: metaDescription,
      }),
    );
    toast.success("Reja ma'lumotlari saqlandi");
    return updatedPlan;
  }, [effectivePlan, metaDescription, metaName, planId, updatePlanMutation]);

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
      <div className="flex flex-col gap-6">
        <TrackingPageHeader
          title={isCreatedDraft ? "Workout reja yaratish" : "Workout rejani tahrirlash"}
          subtitle="Plan nomi, izohi, kunlari va mashqlarini alohida sahifada boshqaring."
          hideTitleOnMobile={false}
          actions={
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeftIcon data-icon="inline-start" />
              Orqaga
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Plan ma'lumotlari</CardTitle>
            <CardDescription>
              Bu ma'lumotlar detail sahifa va plan listda ko'rinadi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Field>
                <FieldLabel htmlFor="edit-plan-name">Plan nomi</FieldLabel>
                <Input
                  id="edit-plan-name"
                  value={metaName}
                  onChange={(event) => setMetaName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-plan-description">Izoh</FieldLabel>
                <Textarea
                  id="edit-plan-description"
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  placeholder="Reja tavsifi"
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleMetaSave}
              disabled={!isMetaDirty || isSaving}
            >
              {isSaving ? (
                <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              Ma'lumotni saqlash
            </Button>
          </CardFooter>
        </Card>

        <WorkoutPlanBuilder
          asPage
          open
          initialPlan={effectivePlan}
          onSave={handleBuilderSave}
          onClose={handleBack}
          isSaving={isSaving}
          lockWeekDays
          submitLabel={isSaving ? "Saqlanmoqda..." : "Saqlash"}
          title={get(effectivePlan, "name") || "Workout plan builder"}
          description="Kunlar, mashqlar, setlar va tartibni tahrirlang."
        />
      </div>
    </PageTransition>
  );
};

export default EditWorkoutPlanPage;
