import React from "react";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import WorkoutLogDrawer from "../../workout-log-drawer.jsx";
import { useCreateWorkoutLog } from "@/hooks/app/use-workout-logs";

const CreateWorkoutLogPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { createLog, isPending } = useCreateWorkoutLog();
  const initialExercise = get(location, "state.initialExercise", null);
  const dateKey = searchParams.get("date") || undefined;

  const closeRoute = React.useCallback(() => {
    navigate(
      {
        pathname: "/user/workout",
        search: location.search,
      },
      { replace: true },
    );
  }, [location.search, navigate]);

  const handleSave = React.useCallback(
    async (payload) => {
      await createLog(payload);
      toast.success(t("user.workout.logPages.createSuccess"));
      closeRoute();
    },
    [closeRoute, createLog, t],
  );

  return (
    <WorkoutLogDrawer
      open
      initialExercise={initialExercise}
      dateKey={dateKey}
      onSave={handleSave}
      isSubmitting={isPending}
      onOpenChange={(open) => {
        if (!open) {
          closeRoute();
        }
      }}
    />
  );
};

export default CreateWorkoutLogPage;
