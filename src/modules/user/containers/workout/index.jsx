import React, { Suspense, lazy } from "react";
import { Navigate, Route, useParams } from "react-router";
import PageLoader from "@/components/page-loader";
import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import WorkoutShell from "./workout-shell";

const ListPage = lazy(() => import("./list"));
const WorkoutHistoryPage = lazy(() => import("./history"));
const WorkoutHistoryDetailPage = lazy(() => import("./history/detail"));
const WorkoutPlansPage = lazy(() => import("./plans"));
const WorkoutPlanDetailPage = lazy(() => import("./plans/detail"));
const WorkoutPlanDayDetailPage = lazy(() => import("./plans/day-detail"));
const WorkoutPlanSessionPage = lazy(() => import("./plans/session"));
const WorkoutPlanSessionSummaryPage = lazy(() =>
  import("./plans/session-summary"),
);
const CreateWorkoutPlanPage = lazy(() => import("./plans/create"));
const EditWorkoutPlanPage = lazy(() => import("./plans/edit"));
const CreateWorkoutLogPage = lazy(() => import("./logs/create"));
const EditWorkoutLogPage = lazy(() => import("./logs/edit"));
const WorkoutExercisesPage = lazy(() => import("./exercises"));
const WorkoutReportPage = lazy(() => import("./report"));
const RunningLivePage = lazy(() => import("./running/live"));

const withSuspense = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const DeprecatedRunningDetailRedirect = () => {
  const { workoutSessionId } = useParams();

  return (
    <Navigate
      to={`/user/workout/history/${workoutSessionId}`}
      replace
    />
  );
};

const Index = () => {
  return (
    <ProfileAwareRoutes>
      <Route element={<WorkoutShell />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route
          path="home"
          element={<Navigate to="/user/workout/overview" replace />}
        />
        <Route path="overview" element={withSuspense(<ListPage />)} />
        <Route path="report" element={withSuspense(<WorkoutReportPage />)} />
        <Route
          path="report/:sessionId"
          element={withSuspense(<WorkoutHistoryDetailPage />)}
        />
        <Route path="history" element={withSuspense(<WorkoutHistoryPage />)} />
        <Route
          path="history/:sessionId"
          element={withSuspense(<WorkoutHistoryDetailPage />)}
        />
        <Route path="plans" element={withSuspense(<WorkoutPlansPage />)} />
        <Route
          path="plans/create"
          element={withSuspense(<CreateWorkoutPlanPage />)}
        />
        <Route
          path="plans/:planId/days/:dayIndex"
          element={withSuspense(<WorkoutPlanDayDetailPage />)}
        />
        <Route
          path="plans/:planId/days/:dayIndex/session"
          element={withSuspense(<WorkoutPlanSessionPage />)}
        />
        <Route
          path="plans/:planId/days/:dayIndex/session/summary"
          element={withSuspense(<WorkoutPlanSessionSummaryPage />)}
        />
        <Route
          path="plans/:planId"
          element={withSuspense(<WorkoutPlanDetailPage />)}
        />
        <Route
          path="plans/edit/:planId"
          element={withSuspense(<EditWorkoutPlanPage />)}
        />
        <Route
          path="running"
          element={<Navigate to="/user/workout/overview" replace />}
        />
        <Route path="running/live" element={withSuspense(<RunningLivePage />)} />
        <Route
          path="running/live/:workoutSessionId"
          element={withSuspense(<RunningLivePage />)}
        />
        <Route
          path="running/history"
          element={<Navigate to="/user/workout/history" replace />}
        />
        <Route
          path="running/:workoutSessionId"
          element={<DeprecatedRunningDetailRedirect />}
        />
        <Route
          path="running/*"
          element={<Navigate to="/user/workout/overview" replace />}
        />
        <Route path="exercises" element={withSuspense(<WorkoutExercisesPage />)} />
        <Route
          path="logs/create"
          element={withSuspense(<CreateWorkoutLogPage />)}
        />
        <Route
          path="logs/edit/:logGroupId"
          element={withSuspense(<EditWorkoutLogPage />)}
        />
      </Route>
    </ProfileAwareRoutes>
  );
};

export default Index;
