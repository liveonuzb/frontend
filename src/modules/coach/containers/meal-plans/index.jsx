import { Navigate, Route, Routes } from "react-router";
import MealPlansListPage from "./list/index.jsx";
import CreateMealPlanPage from "./create/index.jsx";
import EditMealPlanPage from "./edit/index.jsx";

const MealPlansContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<MealPlansListPage />}>
      <Route path="create" element={<CreateMealPlanPage />} />
      <Route path="edit/:id" element={<EditMealPlanPage />} />
    </Route>
  </Routes>
);

export default MealPlansContainer;
