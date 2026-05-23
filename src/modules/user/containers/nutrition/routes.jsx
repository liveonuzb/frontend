import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";
import PageLoader from "@/components/page-loader/index.jsx";
import NutritionShell from "./nutrition-shell.jsx";

const NutritionHomePage = lazy(() => import("./home/index.jsx"));
const NutritionPlansPage = lazy(() => import("./plans/index.jsx"));
const NutritionHistoryPage = lazy(() => import("./history/index.jsx"));
const NutritionReportPage = lazy(() => import("./report/index.jsx"));

const withSuspense = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const NutritionRoutes = () => {
  return (
    <Routes>
      <Route element={<NutritionShell />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={withSuspense(<NutritionHomePage />)} />
        <Route path="plans" element={withSuspense(<NutritionPlansPage />)} />
        <Route path="history" element={withSuspense(<NutritionHistoryPage />)} />
        <Route path="report" element={withSuspense(<NutritionReportPage />)} />
      </Route>
    </Routes>
  );
};

export default NutritionRoutes;
