import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";
import PageLoader from "@/components/page-loader/index.jsx";
import { useAuthStore } from "@/store";
import ProtectedRoute from "@/components/protected-route";
import { getPostAuthRoute } from "@/modules/auth/lib/auth-utils.js";
import { useTelegram } from "@/hooks/use-telegram";
import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { useTelegramBackButton } from "@/hooks/use-telegram-back-button";

const AuthModule = lazy(() => import("@/modules/auth/index.jsx"));
const UserOnboardingModule = lazy(
  () => import("@/modules/onboarding/user/index.jsx"),
);
const CoachOnboardingModule = lazy(
  () => import("@/modules/onboarding/coach/index.jsx"),
);
const AdminModule = lazy(() => import("@/modules/admin/index.jsx"));
const UserModule = lazy(() => import("@/modules/user/index.jsx"));
const CoachModule = lazy(() => import("@/modules/coach/index.jsx"));
const NotFound = lazy(() => import("@/pages/not-found/index.jsx"));
const ReferralRedirectPage = lazy(
  () => import("@/pages/referral-redirect/index.jsx"),
);

const renderRouteElement = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const Index = () => {
  const { isAuthenticated, onboardingCompleted, user } = useAuthStore();
  const { isTelegramWebApp } = useTelegram();
  const passwordSetupRequired = Boolean(user?.passwordSetupRequired);
  useTelegramAuth();
  useTelegramBackButton();

  if (isTelegramWebApp && !isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <Routes>
      <Route
        path="/r/:code"
        element={renderRouteElement(<ReferralRedirectPage />)}
      />

      {isAuthenticated ? (
        <Route
          path="/auth/*"
          element={
            passwordSetupRequired ? (
              renderRouteElement(<AuthModule />)
            ) : (
              <Navigate to={getPostAuthRoute(user)} replace />
            )
          }
        />
      ) : (
        <Route path="/auth/*" element={renderRouteElement(<AuthModule />)} />
      )}

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            {renderRouteElement(<AdminModule />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/onboarding/*"
        element={
          <ProtectedRoute>
            {renderRouteElement(<CoachOnboardingModule />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/*"
        element={
          <ProtectedRoute allowedRoles={["COACH"]}>
            {renderRouteElement(<CoachModule />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/onboarding/*"
        element={
          <ProtectedRoute>
            {renderRouteElement(<UserOnboardingModule />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/*"
        element={
          <ProtectedRoute>
            {onboardingCompleted ? (
              renderRouteElement(<UserModule />)
            ) : (
              <Navigate to="/user/onboarding" replace />
            )}
          </ProtectedRoute>
        }
      />

      <Route path="/*" element={<Navigate to="/auth" replace />} />

      <Route path="*" element={renderRouteElement(<NotFound />)} />
    </Routes>
  );
};

export default Index;
