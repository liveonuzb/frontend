import React from "react";
import { Route, Routes } from "react-router";
import ListPage from "./list";
import CreateWorkoutPlanPage from "./plans/create";
import EditWorkoutPlanPage from "./plans/edit";
import CreateWorkoutLogPage from "./logs/create";
import EditWorkoutLogPage from "./logs/edit";

const WorkoutIndex = () => {
  return (
    <Routes>
      <Route element={<ListPage />}>
        <Route index element={null} />
        <Route path="plans/create" element={<CreateWorkoutPlanPage />} />
        <Route path="plans/edit/:planId" element={<EditWorkoutPlanPage />} />
        <Route path="logs/create" element={<CreateWorkoutLogPage />} />
        <Route path="logs/edit/:logGroupId" element={<EditWorkoutLogPage />} />
      </Route>
    </Routes>
  );
};

export default WorkoutIndex;
