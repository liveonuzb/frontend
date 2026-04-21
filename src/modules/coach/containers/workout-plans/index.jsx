import { Navigate, Route, Routes } from "react-router";
import WorkoutPlansListPage from "./list/index.jsx";
import CreateWorkoutPlanPage from "./create/index.jsx";
import EditWorkoutPlanPage from "./edit/index.jsx";

const WorkoutPlansContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<WorkoutPlansListPage />}>
      <Route path="create" element={<CreateWorkoutPlanPage />} />
      <Route path="edit/:id" element={<EditWorkoutPlanPage />} />
    </Route>
  </Routes>
);

export default WorkoutPlansContainer;
