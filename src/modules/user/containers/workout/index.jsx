import React from "react";
import { Navigate, Route, Routes } from "react-router";
import ListPage from "./list";
import WorkoutHistoryPage from "./history";
import WorkoutHistoryDetailPage from "./history/detail";
import WorkoutPlansPage from "./plans";
import WorkoutPlanDetailPage from "./plans/detail";
import WorkoutPlanDayDetailPage from "./plans/day-detail";
import WorkoutPlanSessionPage from "./plans/session";
import WorkoutPlanSessionSummaryPage from "./plans/session-summary";
import CreateWorkoutPlanPage from "./plans/create";
import EditWorkoutPlanPage from "./plans/edit";
import CreateWorkoutLogPage from "./logs/create";
import EditWorkoutLogPage from "./logs/edit";
import WorkoutExercisesPage from "./exercises";
import RunningPage from "./running";
import RunningLivePage from "./running/live";
import RunningHistoryPage from "./running/history";
import RunningDetailPage from "./running/detail";
import WorkoutShell from "./workout-shell";

const Index = () => {
  return (
    <Routes>
      <Route element={<WorkoutShell />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<ListPage />} />
        <Route path="report" element={<WorkoutHistoryPage />} />
        <Route
          path="report/:sessionId"
          element={<WorkoutHistoryDetailPage />}
        />
        <Route path="history" element={<WorkoutHistoryPage />} />
        <Route
          path="history/:sessionId"
          element={<WorkoutHistoryDetailPage />}
        />
        <Route path="plans" element={<WorkoutPlansPage />} />
        <Route path="plans/create" element={<CreateWorkoutPlanPage />} />
        <Route
          path="plans/:planId/days/:dayIndex"
          element={<WorkoutPlanDayDetailPage />}
        />
        <Route
          path="plans/:planId/days/:dayIndex/session"
          element={<WorkoutPlanSessionPage />}
        />
        <Route
          path="plans/:planId/days/:dayIndex/session/summary"
          element={<WorkoutPlanSessionSummaryPage />}
        />
        <Route path="plans/:planId" element={<WorkoutPlanDetailPage />} />
        <Route path="plans/edit/:planId" element={<EditWorkoutPlanPage />} />
        <Route path="running" element={<RunningPage />} />
        <Route path="running/live" element={<RunningLivePage />} />
        <Route
          path="running/live/:workoutSessionId"
          element={<RunningLivePage />}
        />
        <Route path="running/history" element={<RunningHistoryPage />} />
        <Route
          path="running/:workoutSessionId"
          element={<RunningDetailPage />}
        />
        <Route path="exercises" element={<WorkoutExercisesPage />} />
        <Route path="logs/create" element={<CreateWorkoutLogPage />} />
        <Route path="logs/edit/:logGroupId" element={<EditWorkoutLogPage />} />
      </Route>
    </Routes>
  );
};

export default Index;
