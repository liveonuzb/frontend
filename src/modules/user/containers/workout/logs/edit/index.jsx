import React from "react";
import { get } from "lodash";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import PageLoader from "@/components/page-loader/index.jsx";
import WorkoutLogDrawer from "../../workout-log-drawer.jsx";
import {
  useUpdateWorkoutLog,
  useWorkoutLog,
} from "@/hooks/app/use-workout-logs";

const EditWorkoutLogPage = () => {
  const { logGroupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateLog, isPending } = useUpdateWorkoutLog();
  const routeInitialLog = get(location, "state.initialLog", null);
  const { log, isLoading } = useWorkoutLog(logGroupId, {
    enabled: Boolean(logGroupId),
  });
  const effectiveLog = log?.id ? log : routeInitialLog;

  const closeRoute = React.useCallback(() => {
    navigate(
      {
        pathname: "/user/workout",
        search: location.search,
      },
      { replace: true },
    );
  }, [location.search, navigate]);

  React.useEffect(() => {
    if (!logGroupId || isLoading || effectiveLog) {
      return;
    }

    toast.error("Workout log topilmadi");
    closeRoute();
  }, [closeRoute, effectiveLog, isLoading, logGroupId]);

  const handleSave = React.useCallback(
    async (payload) => {
      await updateLog(logGroupId, payload);
      toast.success("Workout log yangilandi");
      closeRoute();
    },
    [closeRoute, logGroupId, updateLog],
  );

  if (isLoading && !effectiveLog) {
    return <PageLoader />;
  }

  if (!effectiveLog) {
    return null;
  }

  return (
    <WorkoutLogDrawer
      open
      initialLog={effectiveLog}
      dateKey={get(effectiveLog, "date", undefined)}
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

export default EditWorkoutLogPage;
