import { Navigate, Route, Routes } from "react-router";
import ListPage from "./list/index.jsx";

const MealPlansContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />} />
  </Routes>
);

export default MealPlansContainer;
