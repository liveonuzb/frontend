import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";

import Layout from "@/modules/admin/layout/index.jsx";
import PageLoader from "@/components/page-loader/index.jsx";
import ErrorBoundary from "@/components/error-boundary/index.jsx";
import AdminCapabilityRoute from "@/modules/admin/components/admin-capability-route.jsx";

const DashboardPage = lazy(
  () => import("@/modules/admin/pages/dashboard/index.jsx"),
);
const UsersPage = lazy(() => import("@/modules/admin/pages/users/index.jsx"));
const CoachesPage = lazy(
  () => import("@/modules/admin/pages/coaches/index.jsx"),
);
const AiPage = lazy(() => import("@/modules/admin/pages/ai/index.jsx"));
const TrackingPage = lazy(
  () => import("@/modules/admin/pages/tracking/index.jsx"),
);
const NotificationsPage = lazy(
  () => import("@/modules/admin/pages/notifications/index.jsx"),
);
const FoodsPage = lazy(() => import("@/modules/admin/pages/foods/index.jsx"));
const LocationsPage = lazy(
  () => import("@/modules/admin/pages/locations/index.jsx"),
);
const FoodCategoriesPage = lazy(
  () => import("@/modules/admin/pages/food-categories/index.jsx"),
);
const IngredientsPage = lazy(
  () => import("@/modules/admin/pages/ingredients/index.jsx"),
);
const CuisinesPage = lazy(
  () => import("@/modules/admin/pages/cuisines/index.jsx"),
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
const RevenuePage = lazy(
  () => import("@/modules/admin/pages/revenue/index.jsx"),
);
const WithdrawalsPage = lazy(
  () => import("@/modules/admin/pages/withdrawals/index.jsx"),
);
// Old SubscriptionsPage replaced by redirect to premium subscriptions tab
const PremiumPage = lazy(
  () => import("@/modules/admin/pages/premium/index.jsx"),
);
const ReportsPage = lazy(
  () => import("@/modules/admin/pages/reports/index.jsx"),
);
const ContentQualityPage = lazy(
  () => import("@/modules/admin/pages/content-quality/index.jsx"),
);
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
const PlatformBotPage = lazy(
  () => import("@/modules/admin/pages/platform-bot/index.jsx"),
);
const CoachSpecializationsPage = lazy(
  () => import("@/modules/admin/pages/coach-specializations/index.jsx"),
);
const HealthConstraintsPage = lazy(
  () => import("@/modules/admin/pages/health-constraints/index.jsx"),
);
const UserGoalsPage = lazy(
  () => import("@/modules/admin/pages/user-goals/index.jsx"),
);
const NutritionPreferencesPage = lazy(
  () => import("@/modules/admin/pages/nutrition-preferences/index.jsx"),
);
const MealPlansPage = lazy(
  () => import("@/modules/admin/pages/meal-plans/index.jsx"),
);
const NotFound = lazy(() => import("@/pages/not-found/index.jsx"));

const renderAdminRoute = (
  Component,
  guardProps = { capability: "admin.read" },
) => (
  <AdminCapabilityRoute {...guardProps}>
    <Suspense fallback={<PageLoader />}>
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </Suspense>
  </AdminCapabilityRoute>
);

const Index = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={renderAdminRoute(DashboardPage)} />
        <Route
          path="users/*"
          element={renderAdminRoute(UsersPage, { capability: "support.read" })}
        />
        <Route
          path="coaches/*"
          element={renderAdminRoute(CoachesPage, {
            capability: "support.read",
          })}
        />
        <Route
          path="tracking"
          element={renderAdminRoute(TrackingPage, {
            capability: "support.read",
          })}
        />
        <Route
          path="foods/*"
          element={renderAdminRoute(FoodsPage, { capability: "content.read" })}
        />
        <Route
          path="locations/*"
          element={renderAdminRoute(LocationsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="food-categories/*"
          element={renderAdminRoute(FoodCategoriesPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="ingredients/*"
          element={renderAdminRoute(IngredientsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="cuisines/*"
          element={renderAdminRoute(CuisinesPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="workouts/*"
          element={renderAdminRoute(WorkoutsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="workout-plans/*"
          element={renderAdminRoute(WorkoutPlansPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="workout-categories/*"
          element={renderAdminRoute(WorkoutCategoriesPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="workout-muscles/*"
          element={renderAdminRoute(WorkoutMusclesPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="workout-body-parts/*"
          element={renderAdminRoute(WorkoutBodyPartsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="equipments/*"
          element={renderAdminRoute(EquipmentsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="revenue"
          element={renderAdminRoute(RevenuePage, {
            capability: "finance.read",
          })}
        />
        <Route
          path="withdrawals"
          element={renderAdminRoute(WithdrawalsPage, {
            capability: "finance.read",
          })}
        />
        <Route
          path="subscriptions"
          element={<Navigate to="/admin/premium/subscriptions" replace />}
        />
        <Route
          path="premium/*"
          element={renderAdminRoute(PremiumPage, { capability: "growth.read" })}
        />
        <Route path="reports" element={renderAdminRoute(ReportsPage)} />
        <Route
          path="content-quality"
          element={renderAdminRoute(ContentQualityPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="activity-feed"
          element={renderAdminRoute(ActivityFeedPage)}
        />
        <Route
          path="audit-logs"
          element={renderAdminRoute(AuditLogsPage, {
            roles: ["SUPER_ADMIN", "READONLY_ADMIN"],
          })}
        />
        <Route
          path="languages/*"
          element={renderAdminRoute(LanguagesPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="achievements/*"
          element={renderAdminRoute(AchievementsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="settings"
          element={renderAdminRoute(SettingsPage, {
            capability: "settings.manage",
          })}
        />
        <Route
          path="ai"
          element={renderAdminRoute(AiPage, {
            capability: "settings.manage",
          })}
        />
        <Route
          path="notifications"
          element={renderAdminRoute(NotificationsPage, {
            capability: "support.read",
          })}
        />
        <Route
          path="platform-bot"
          element={renderAdminRoute(PlatformBotPage, {
            capability: "growth.read",
          })}
        />
        <Route
          path="challenges/*"
          element={renderAdminRoute(ChallengesPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="coach-specializations/*"
          element={renderAdminRoute(CoachSpecializationsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="health-constraints/*"
          element={renderAdminRoute(HealthConstraintsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="user-goals/*"
          element={renderAdminRoute(UserGoalsPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="nutrition-preferences/*"
          element={renderAdminRoute(NutritionPreferencesPage, {
            capability: "content.read",
          })}
        />
        <Route
          path="meal-plans/*"
          element={renderAdminRoute(MealPlansPage, {
            capability: "content.read",
          })}
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
