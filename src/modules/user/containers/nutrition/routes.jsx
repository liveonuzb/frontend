import React, { Suspense, lazy } from "react";
import { Navigate, Route } from "react-router";
import PageLoader from "@/components/page-loader/index.jsx";
import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import NutritionShell from "./nutrition-shell.jsx";

const NutritionOverviewPage = lazy(() => import("./home/index.jsx"));
const NutritionPlansPage = lazy(() => import("./plans/index.jsx"));
const NutritionRecipesPage = lazy(() => import("./recipes/index.jsx"));
const NutritionRecipeDetailPage = lazy(() => import("./recipes/detail.jsx"));
const NutritionRecipeCreatePage = lazy(() => import("./recipes/create.jsx"));
const NutritionRecipeCookingPage = lazy(() => import("./recipes/cooking.jsx"));
const NutritionHistoryPage = lazy(() => import("./history/index.jsx"));
const NutritionReportPage = lazy(() => import("./report/index.jsx"));

const withSuspense = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const NutritionRoutes = () => {
  return (
    <ProfileAwareRoutes>
      <Route element={<NutritionShell />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route
          path="overview"
          element={withSuspense(<NutritionOverviewPage />)}
        />
        <Route path="plans" element={withSuspense(<NutritionPlansPage />)} />
        <Route
          path="recipes"
          element={withSuspense(<NutritionRecipesPage />)}
        />
        <Route
          path="recipes/create"
          element={withSuspense(<NutritionRecipeCreatePage />)}
        />
        <Route
          path="recipes/:slugOrId/cook"
          element={withSuspense(<NutritionRecipeCookingPage />)}
        />
        <Route
          path="recipes/:slugOrId"
          element={withSuspense(<NutritionRecipeDetailPage />)}
        />
        <Route
          path="history"
          element={withSuspense(<NutritionHistoryPage />)}
        />
        <Route path="report" element={withSuspense(<NutritionReportPage />)} />
      </Route>
    </ProfileAwareRoutes>
  );
};

export default NutritionRoutes;
