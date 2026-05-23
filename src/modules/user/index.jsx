import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router";
import Layout from "@/modules/user/layout/index.jsx";
import PageLoader from "@/components/page-loader/index.jsx";
import ErrorBoundary from "@/components/error-boundary/index.jsx";
import { DEFAULT_PROFILE_TAB } from "@/modules/profile/hooks/use-profile-overlay";
import { normalizeProfileOverlayTab } from "@/modules/profile/lib/profile-tab-registry";
import { getStandaloneProfileTabPath } from "@/modules/profile/lib/profile-tab-navigation";
import {
  USER_CHALLENGES_ENABLED,
  USER_LEADERBOARD_ENABLED,
} from "@/modules/user/user-feature-flags.js";

const DashboardPage = lazy(
  () => import("@/modules/user/pages/dashboard/index.jsx"),
);
const DashboardDailyReportDrawerPage = lazy(
  () => import("@/modules/user/pages/dashboard/daily-report-drawer.jsx"),
);
const NutritionPage = lazy(
  () => import("@/modules/user/pages/nutrition/index.jsx"),
);
const WaterPage = lazy(() => import("@/modules/user/pages/water/index.jsx"));
const HealthPage = lazy(() => import("@/modules/user/pages/health/index.jsx"));
const ReportPage = lazy(() => import("@/modules/user/pages/report/index.jsx"));
const DailyReportPage = lazy(
  () => import("@/modules/user/pages/report/daily.jsx"),
);
const TenDayReportPage = lazy(
  () => import("@/modules/user/pages/report/ten-day.jsx"),
);

const MeasurementsPage = lazy(
  () => import("@/modules/user/pages/measurements/index.jsx"),
);
const WorkoutPage = lazy(() => import("@/modules/user/pages/workout"));

const FriendsPage = lazy(
  () => import("@/modules/user/pages/friends/index.jsx"),
);
const ChallengesPage = lazy(
  () => import("@/modules/user/pages/challenges/index.jsx"),
);
const PaymentsPage = lazy(
  () => import("@/modules/user/pages/payments/index.jsx"),
);

const PublicProfilePage = lazy(
  () => import("@/modules/user/pages/public-profile/index.jsx"),
);

const AchievementsPage = lazy(
  () => import("@/modules/user/pages/achievements/index.jsx"),
);
const LeaderboardPage = lazy(
  () => import("@/modules/user/pages/leaderboard/index.jsx"),
);
const XpHistoryPage = lazy(
  () => import("@/modules/user/pages/xp-history/index.jsx"),
);

const FavoritesPage = lazy(
  () => import("@/modules/user/pages/favorites/index.jsx"),
);

const NotificationsPage = lazy(
  () => import("@/modules/user/pages/notifications/index.jsx"),
);
const ReferralsPage = lazy(
  () => import("@/modules/user/pages/referrals/index.jsx"),
);
const ChatModule = lazy(() => import("@/modules/chat/index.jsx"));

const NotFound = lazy(() => import("@/pages/not-found/index.jsx"));

export const ProfileRedirect = () => {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") ?? DEFAULT_PROFILE_TAB;
  const standalonePath = getStandaloneProfileTabPath(
    requestedTab,
    searchParams.toString(),
  );

  if (standalonePath) {
    return <Navigate to={standalonePath} replace />;
  }

  const profileParams = new URLSearchParams(searchParams);
  profileParams.delete("tab");
  profileParams.set("profile", "open");
  profileParams.set("profileTab", normalizeProfileOverlayTab(requestedTab));

  return (
    <Navigate to={`/user/dashboard?${profileParams.toString()}`} replace />
  );
};

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
        >
          <Route
            path="report/daily/:date?"
            element={
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary>
                  <DashboardDailyReportDrawerPage />
                </ErrorBoundary>
              </Suspense>
            }
          />
        </Route>
        <Route
          path="nutrition/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <NutritionPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="water"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <WaterPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="health"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <HealthPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="report"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <ReportPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="report/daily/:date?"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <DailyReportPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="report/range/:days?"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <TenDayReportPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="measurements"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <MeasurementsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="workout/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <WorkoutPage />
              </ErrorBoundary>
            </Suspense>
          }
        />

        <Route
          path="friends"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <FriendsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="challenges/*"
          element={
            USER_CHALLENGES_ENABLED ? (
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary>
                  <ChallengesPage />
                </ErrorBoundary>
              </Suspense>
            ) : (
              <Navigate to="/user/dashboard" replace />
            )
          }
        />
        <Route
          path="payments"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <PaymentsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="achievements"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <AchievementsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="leaderboard"
          element={
            USER_LEADERBOARD_ENABLED ? (
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary>
                  <LeaderboardPage />
                </ErrorBoundary>
              </Suspense>
            ) : (
              <Navigate to="/user/dashboard" replace />
            )
          }
        />
        <Route
          path="xp-history"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <XpHistoryPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="favorites"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <FavoritesPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="notifications"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <NotificationsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="referrals"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <ReferralsPage />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <ProfileRedirect />
            </Suspense>
          }
        />
        <Route
          path="chat/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <ChatModule />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="u/:identifier"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <PublicProfilePage />
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
