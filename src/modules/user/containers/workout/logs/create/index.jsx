import React from "react";
import { get } from "lodash";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import WorkoutLogDrawer from "../../workout-log-drawer.jsx";
import { useCreateWorkoutLog } from "@/hooks/app/use-workout-logs";

const CreateWorkoutLogPage = () => {
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
      toast.success("Workout log saqlandi");
      closeRoute();
    },
    [closeRoute, createLog],
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
