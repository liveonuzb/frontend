import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router";

import Layout from "@/modules/coach/layout/index.jsx";
import PageLoader from "@/components/page-loader/index.jsx";
import ErrorBoundary from "@/components/error-boundary/index.jsx";

const DashboardPage = lazy(
  () => import("@/modules/coach/pages/dashboard/index.jsx"),
);
const ClientsPage = lazy(() => import("@/modules/coach/pages/clients/index.jsx"));
const MealPlansPage = lazy(
  () => import("@/modules/coach/pages/meal-plans/index.jsx"),
);
const WorkoutPlansPage = lazy(
  () => import("@/modules/coach/pages/workout-plans/index.jsx"),
);
const PaymentsPage = lazy(
  () => import("@/modules/coach/pages/payments/index.jsx"),
);
const TelegramGroupsPage = lazy(
  () => import("@/modules/coach/pages/groups/index.jsx"),
);
const ProfilePage = lazy(
  () => import("@/modules/profile/pages/profile/index.jsx"),
);
const SettingsPage = lazy(
  () => import("@/modules/profile/pages/profile/index.jsx"),
);
const SnippetsPage = lazy(
  () => import("@/modules/coach/pages/snippets/index.jsx"),
);
const NotFound = lazy(() => import("@/pages/not-found/index.jsx"));

const renderPage = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  </Suspense>
);

const ClientDetailRedirect = () => {
  const { id } = useParams();

  return (
    <Navigate
      to={`/coach/clients?clientId=${encodeURIComponent(id ?? "")}`}
      replace
    />
  );
};

const LegacyCoachRedirect = ({ to }) => {
  const location = useLocation();

  return <Navigate to={`${to}${location.search}`} replace />;
};

const Index = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={renderPage(DashboardPage)} />
        <Route path="clients" element={renderPage(ClientsPage)} />
        <Route path="clients/:id" element={<ClientDetailRedirect />} />
        <Route path="meal-plans" element={renderPage(MealPlansPage)} />
        <Route path="workout-plans" element={renderPage(WorkoutPlansPage)} />
        <Route path="payments" element={renderPage(PaymentsPage)} />
        <Route
          path="purchase-queue"
          element={<LegacyCoachRedirect to="/coach/payments" />}
        />
        <Route
          path="telegram-groups/*"
          element={renderPage(TelegramGroupsPage)}
        />
        <Route
          path="marketplace"
          element={<LegacyCoachRedirect to="/coach/clients" />}
        />
        <Route
          path="courses"
          element={<LegacyCoachRedirect to="/coach/clients" />}
        />
        <Route
          path="packages"
          element={<LegacyCoachRedirect to="/coach/payments" />}
        />
        <Route
          path="groups"
          element={<LegacyCoachRedirect to="/coach/telegram-groups" />}
        />
        <Route
          path="telegram-bot"
          element={<LegacyCoachRedirect to="/coach/telegram-groups" />}
        />
        <Route
          path="chat/*"
          element={<Navigate to="/coach/dashboard" replace />}
        />
        <Route
          path="messages"
          element={<Navigate to="/coach/dashboard" replace />}
        />
        <Route path="snippets/*" element={renderPage(SnippetsPage)} />
        <Route path="profile" element={renderPage(ProfilePage)} />
        <Route path="settings" element={renderPage(SettingsPage)} />
        <Route path="*" element={renderPage(NotFound)} />
      </Route>
    </Routes>
  );
};

export default Index;
