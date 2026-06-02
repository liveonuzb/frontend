import React from "react";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import PageLoader from "@/components/page-loader/index.jsx";
import WorkoutLogDrawer from "../../workout-log-drawer.jsx";
import {
  useUpdateWorkoutLog,
  useWorkoutLog,
} from "@/hooks/app/use-workout-logs";

const EditWorkoutLogPage = () => {
  const { t } = useTranslation();
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

    toast.error(t("user.workout.logPages.notFound"));
    closeRoute();
  }, [closeRoute, effectiveLog, isLoading, logGroupId, t]);

  const handleSave = React.useCallback(
    async (payload) => {
      await updateLog(logGroupId, payload);
      toast.success(t("user.workout.logPages.updateSuccess"));
      closeRoute();
    },
    [closeRoute, logGroupId, t, updateLog],
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
