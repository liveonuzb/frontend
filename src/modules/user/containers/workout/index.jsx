import React from "react";
import { Route, Routes } from "react-router";
import ListPage from "./list/index.jsx";
import CreateWorkoutPlanPage from "./plans/create/index.jsx";
import EditWorkoutPlanPage from "./plans/edit/index.jsx";
import CreateWorkoutLogPage from "./logs/create/index.jsx";
import EditWorkoutLogPage from "./logs/edit/index.jsx";

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
