import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";

import Layout from "@/modules/admin/layout/index.jsx";
import PageLoader from "@/components/page-loader/index.jsx";
import ErrorBoundary from "@/components/error-boundary/index.jsx";

const DashboardPage = lazy(
  () => import("@/modules/admin/pages/dashboard/index.jsx"),
);
const UsersPage = lazy(
  () => import("@/modules/admin/pages/users/index.jsx"),
);
const CoachesPage = lazy(() => import("@/modules/admin/pages/coaches/index.jsx"));
const FoodsPage = lazy(() => import("@/modules/admin/pages/foods/index.jsx"));
const LocationsPage = lazy(
  () => import("@/modules/admin/pages/locations/index.jsx"),
);
const FoodCategoriesPage = lazy(
  () => import("@/modules/admin/pages/food-categories/index.jsx"),
);
const WorkoutsPage = lazy(
  () => import("@/modules/admin/pages/workouts/index.jsx"),
);
const WorkoutPlansPage = lazy(
  () => import("@/modules/admin/pages/workout-plans/index.jsx"),
);
const WorkoutCategoriesPage = lazy(
  () => import("@/modules/admin/pages/workout-categories/index.jsx"),
);
const WorkoutMusclesPage = lazy(
  () => import("@/modules/admin/pages/workout-muscles/index.jsx"),
);
const WorkoutBodyPartsPage = lazy(
  () => import("@/modules/admin/pages/workout-body-parts/index.jsx"),
);
const EquipmentsPage = lazy(
  () => import("@/modules/admin/pages/equipments/index.jsx"),
);
const RevenuePage = lazy(() => import("@/modules/admin/pages/revenue/index.jsx"));
// Old SubscriptionsPage replaced by redirect to premium subscriptions tab
const PremiumPage = lazy(() => import("@/modules/admin/pages/premium/index.jsx"));
const ReportsPage = lazy(() => import("@/modules/admin/pages/reports/index.jsx"));
const ActivityFeedPage = lazy(
  () => import("@/modules/admin/pages/activity-feed/index.jsx"),
);
const AuditLogsPage = lazy(
  () => import("@/modules/admin/pages/audit-logs/index.jsx"),
);
const LanguagesPage = lazy(
  () => import("@/modules/admin/pages/languages/index.jsx"),
);
const SettingsPage = lazy(
  () => import("@/modules/admin/pages/settings/index.jsx"),
);
const ChallengesPage = lazy(
  () => import("@/modules/admin/pages/challenges/index.jsx"),
);
const AchievementsPage = lazy(
  () => import("@/modules/admin/pages/achievements/index.jsx"),
);
const CoachSpecializationsPage = lazy(
  () => import("@/modules/admin/pages/coach-specializations/index.jsx"),
);
const NotFound = lazy(() => import("@/pages/not-found/index.jsx"));

const Index = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <DashboardPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="users/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <UsersPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="coaches"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <CoachesPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="foods/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <FoodsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="locations"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <LocationsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="food-categories/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <FoodCategoriesPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="workouts/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <WorkoutsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="workout-plans"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <WorkoutPlansPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="workout-categories/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <WorkoutCategoriesPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="workout-muscles"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <WorkoutMusclesPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="workout-body-parts"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <WorkoutBodyPartsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="equipments/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <EquipmentsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="revenue"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <RevenuePage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="subscriptions"
          element={<Navigate to="/admin/premium/subscriptions" replace />}
        />
        <Route
          path="premium/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <PremiumPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <ReportsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="activity-feed"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <ActivityFeedPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="audit-logs"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <AuditLogsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="languages/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <LanguagesPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="achievements/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <AchievementsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <SettingsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="challenges/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <ChallengesPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="coach-specializations/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <CoachSpecializationsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
};

export default Index;
