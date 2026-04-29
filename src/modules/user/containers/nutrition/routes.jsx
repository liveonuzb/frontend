import React from "react";
import { Navigate, Route, Routes } from "react-router";
import NutritionShell from "./nutrition-shell.jsx";
import NutritionHomePage from "./home/index.jsx";
import NutritionPlansPage from "./plans/index.jsx";
import NutritionMealsPage from "./meals/index.jsx";
import NutritionReportPage from "./report/index.jsx";

const NutritionRoutes = () => {
  return (
    <Routes>
      <Route element={<NutritionShell />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<NutritionHomePage />} />
        <Route path="plans" element={<NutritionPlansPage />} />
        <Route path="meals" element={<NutritionMealsPage />} />
        <Route path="report" element={<NutritionReportPage />} />
      </Route>
    </Routes>
  );
};

export default NutritionRoutes;
