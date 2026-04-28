import React from "react";
import { Route, Routes } from "react-router";
import ListPage from "./list";
import WorkoutPlansPage from "./plans";
import WorkoutPlanDetailPage from "./plans/detail";
import CreateWorkoutPlanPage from "./plans/create";
import EditWorkoutPlanPage from "./plans/edit";
import CreateWorkoutLogPage from "./logs/create";
import EditWorkoutLogPage from "./logs/edit";

const Index = () => {
  return (
    <Routes>
      <Route index element={<ListPage />} />
      <Route path="plans" element={<WorkoutPlansPage />} />
      <Route path="plans/create" element={<CreateWorkoutPlanPage />} />
      <Route path="plans/:planId" element={<WorkoutPlanDetailPage />} />
      <Route path="plans/edit/:planId" element={<EditWorkoutPlanPage />} />
      <Route path="logs/create" element={<CreateWorkoutLogPage />} />
      <Route path="logs/edit/:logGroupId" element={<EditWorkoutLogPage />} />
    </Routes>
  );
};

export default Index;
