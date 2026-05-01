import { Navigate, Route, Routes } from "react-router";
import ListPage from "./list/index.jsx";

const NutritionPreferencesIndex = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />} />
  </Routes>
);

export default NutritionPreferencesIndex;
