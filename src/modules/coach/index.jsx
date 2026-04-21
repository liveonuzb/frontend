import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router";

import Layout from "@/modules/coach/layout/index.jsx";
import PageLoader from "@/components/page-loader/index.jsx";
import CoachErrorBoundary from "@/modules/coach/components/coach-error-boundary.jsx";

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
const CoursesPage = lazy(
  () => import("@/modules/coach/pages/courses/index.jsx"),
);
const CoursePurchasesPage = lazy(
  () => import("@/modules/coach/pages/course-purchases/index.jsx"),
);
const EarningsPage = lazy(
  () => import("@/modules/coach/pages/earnings/index.jsx"),
);
const TelegramGroupsPage = lazy(
  () => import("@/modules/coach/pages/groups/index.jsx"),
);
const TelegramBotPage = lazy(
  () => import("@/modules/coach/pages/telegram-bot/index.jsx"),
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
const ChallengePage = lazy(
  () => import("@/modules/coach/pages/challenges/index.jsx"),
);
const ProgramsPage = lazy(
  () => import("@/modules/coach/pages/programs/index.jsx"),
);
const NotFound = lazy(() => import("@/pages/not-found/index.jsx"));
const NotificationsPage = lazy(
  () => import("@/modules/coach/pages/notifications/index.jsx"),
);
const ReferralsPage = lazy(
  () => import("@/modules/coach/pages/referrals/index.jsx"),
);
const AuditPage = lazy(
  () => import("@/modules/coach/pages/audit/index.jsx"),
);
const SessionsPage = lazy(
  () => import("@/modules/coach/pages/sessions/index.jsx"),
);
const ReportsPage = lazy(
  () => import("@/modules/coach/pages/reports/index.jsx"),
);
const AiPage = lazy(
  () => import("@/modules/coach/pages/ai/index.jsx"),
);

const renderPage = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <CoachErrorBoundary>
      <Component />
    </CoachErrorBoundary>
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
        <Route path="meal-plans/*" element={renderPage(MealPlansPage)} />
        <Route path="workout-plans/*" element={renderPage(WorkoutPlansPage)} />
        <Route path="courses/*" element={renderPage(CoursesPage)} />
        <Route
          path="course-purchases/*"
          element={renderPage(CoursePurchasesPage)}
        />
        <Route
          path="purchase-queue"
          element={<LegacyCoachRedirect to="/coach/course-purchases" />}
        />
        <Route path="payments/*" element={renderPage(PaymentsPage)} />
        <Route path="earnings/*" element={renderPage(EarningsPage)} />
        <Route
          path="telegram-groups/*"
          element={renderPage(TelegramGroupsPage)}
        />
        <Route
          path="groups"
          element={<LegacyCoachRedirect to="/coach/telegram-groups" />}
        />
        <Route path="telegram-bot/*" element={renderPage(TelegramBotPage)} />
        <Route path="programs/*" element={renderPage(ProgramsPage)} />
        <Route path="challenges/*" element={renderPage(ChallengePage)} />
        <Route path="snippets/*" element={renderPage(SnippetsPage)} />
        <Route path="notifications/*" element={renderPage(NotificationsPage)} />
        <Route path="sessions/*" element={renderPage(SessionsPage)} />
        <Route path="reports/*" element={renderPage(ReportsPage)} />
        <Route path="ai/*" element={renderPage(AiPage)} />
        <Route path="referrals/*" element={renderPage(ReferralsPage)} />
        <Route path="audit-logs/*" element={renderPage(AuditPage)} />
        <Route path="profile" element={renderPage(ProfilePage)} />
        <Route path="settings" element={renderPage(SettingsPage)} />
        <Route path="*" element={renderPage(NotFound)} />
      </Route>
    </Routes>
  );
};

export default Index;
