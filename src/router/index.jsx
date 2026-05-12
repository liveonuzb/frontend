import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import { useAuthStore, useLanguageStore, useAppModeStore } from "@/store";
import ProtectedRoute from "@/components/protected-route";
import {
  getAuthErrorMessage,
  getPostAuthRoute,
} from "@/modules/auth/lib/auth-utils.js";
import { useTelegram } from "@/hooks/use-telegram";
import { useTelegramAuth } from "@/hooks/use-telegram-auth";
import { useTelegramBackButton } from "@/hooks/use-telegram-back-button";
import { Button } from "@/components/ui/button";
import {
  canAccessUserDashboard,
  getPostOnboardingPath,
} from "@/lib/app-paths.js";

const AuthModule = lazy(() => import("@/modules/auth/index.jsx"));
const LandingModule = lazy(() => import("@/modules/landing/index.jsx"));
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
const JoinReferralPage = lazy(() => import("@/pages/referral-join/index.jsx"));

const renderRouteElement = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const TelegramAuthError = ({ error, onRetry }) => (
  <div className="flex min-h-svh items-center justify-center bg-background px-6">
    <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">
          Telegram orqali kirib bo'lmadi
        </h1>
        <p className="text-sm text-muted-foreground">
          {getAuthErrorMessage(
            error,
            "Sessiya muddati tugagan bo'lishi mumkin. Telegramdan qayta oching yoki yana urinib ko'ring.",
          )}
        </p>
      </div>
      <Button type="button" onClick={onRetry}>
        <RefreshCwIcon data-icon="inline-start" />
        Qayta urinish
      </Button>
    </div>
  </div>
);

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "CONTENT_MANAGER",
  "SUPPORT",
  "FINANCE",
  "GROWTH",
  "READONLY_ADMIN",
];

const Index = () => {
  const { isAuthenticated, onboardingCompleted, onboardingFlowStatus, user } =
    useAuthStore();
  const { isTelegramWebApp } = useTelegram();
  const passwordSetupRequired = Boolean(user?.passwordSetupRequired);
  const hasSelectedLanguage = useLanguageStore(
    (state) => state.hasSelectedLanguage,
  );
  const appMode = useAppModeStore((state) => state.mode);
  const location = useLocation();
  const { telegramAuthError, retryTelegramAuth } = useTelegramAuth();
  useTelegramBackButton();

  if (isTelegramWebApp && !isAuthenticated) {
    if (telegramAuthError) {
      return (
        <TelegramAuthError
          error={telegramAuthError}
          onRetry={retryTelegramAuth}
        />
      );
    }

    return <PageLoader />;
  }

  // Pre-auth onboarding flow: language -> mode -> auth -> onboarding.
  // Authenticated Telegram WebApp users must be allowed to finish password setup
  // before any public language/mode redirect can run.
  if (!isAuthenticated && !isTelegramWebApp) {
    const referralPaths = ["/r/", "/ref/", "/join"];
    const isReferralPath = referralPaths.some((path) =>
      location.pathname.startsWith(path),
    );
    const isLandingPath = location.pathname === "/";

    if (!isReferralPath && !isLandingPath) {
      if (
        !hasSelectedLanguage &&
        location.pathname !== "/auth/select-language"
      ) {
        return <Navigate to="/auth/select-language" replace />;
      }
      if (
        hasSelectedLanguage &&
        !appMode &&
        location.pathname !== "/auth/select-mode" &&
        location.pathname !== "/auth/select-language"
      ) {
        return <Navigate to="/auth/select-mode" replace />;
      }
    }
  }

  return (
    <Routes>
      <Route
        path="/r/:code"
        element={renderRouteElement(<ReferralRedirectPage />)}
      />
      <Route
        path="/ref/:code"
        element={renderRouteElement(<ReferralRedirectPage />)}
      />
      <Route path="/join" element={renderRouteElement(<JoinReferralPage />)} />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={getPostAuthRoute(user)} replace />
          ) : (
            renderRouteElement(<LandingModule />)
          )
        }
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
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
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
            {canAccessUserDashboard(
              onboardingFlowStatus,
              onboardingCompleted,
            ) ? (
              renderRouteElement(<UserModule />)
            ) : (
              <Navigate to={getPostOnboardingPath(user)} replace />
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
