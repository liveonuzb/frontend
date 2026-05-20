import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { resolveTelegramStartParamRoute } from "@/lib/telegram-start-param.js";
import {
  ADMIN_ROLES,
  getPreAuthRedirectPath,
  shouldShowTelegramAuthLoader,
} from "./route-guards.js";

const AuthModule = lazy(() => import("@/modules/auth/index.jsx"));
const LandingModule = lazy(() => import("@/modules/landing/index.jsx"));
const UserOnboardingModule = lazy(
  () => import("@/modules/user-onboarding/index.jsx"),
);
const AdminModule = lazy(() => import("@/modules/admin/index.jsx"));
const UserModule = lazy(() => import("@/modules/user/index.jsx"));
const NotFound = lazy(() => import("@/pages/not-found/index.jsx"));
const ReferralRedirectPage = lazy(
  () => import("@/pages/referral-redirect/index.jsx"),
);

const renderRouteElement = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const TelegramAuthError = ({ error, onRetry }) => (
  <TelegramAuthErrorContent error={error} onRetry={onRetry} />
);

const TelegramAuthErrorContent = ({ error, onRetry }) => {
  const { t } = useTranslation();
  const fallbackMessage = t("auth.telegramAuth.errorDescription");

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangleIcon className="size-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">
            {t("auth.telegramAuth.errorTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {getAuthErrorMessage(error, fallbackMessage)}
          </p>
        </div>
        <Button type="button" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" />
          {t("auth.telegramAuth.retry")}
        </Button>
      </div>
    </div>
  );
};

const Index = () => {
  const {
    isAuthenticated,
    onboardingCompleted,
    onboardingFlowStatus,
    user,
    isHydrated,
  } = useAuthStore();
  const { isTelegramWebApp, startParam } = useTelegram();
  const passwordSetupRequired = Boolean(user?.passwordSetupRequired);
  const hasSelectedLanguage = useLanguageStore(
    (state) => state.hasSelectedLanguage,
  );
  const appMode = useAppModeStore((state) => state.mode);
  const location = useLocation();
  const { telegramAuthError, retryTelegramAuth } = useTelegramAuth();
  useTelegramBackButton();
  const telegramStartRoute = resolveTelegramStartParamRoute(startParam);

  if (isHydrated === false) {
    return <PageLoader />;
  }

  if (shouldShowTelegramAuthLoader({
    isAuthenticated,
    isTelegramWebApp,
    telegramAuthError,
  })) {
    return <PageLoader />;
  }

  if (isTelegramWebApp && !isAuthenticated && telegramAuthError) {
    if (telegramAuthError) {
      return (
        <TelegramAuthError
          error={telegramAuthError}
          onRetry={retryTelegramAuth}
        />
      );
    }

  }

  // Pre-auth onboarding flow: language -> mode -> auth -> onboarding.
  // Authenticated Telegram WebApp users must be allowed to finish password setup
  // before any public language/mode redirect can run.
  const preAuthRedirectPath = getPreAuthRedirectPath({
    isAuthenticated,
    isTelegramWebApp,
    hasSelectedLanguage,
    appMode,
    pathname: location.pathname,
  });

  if (preAuthRedirectPath) {
    return <Navigate to={preAuthRedirectPath} replace />;
  }

  if (
    isAuthenticated &&
    isTelegramWebApp &&
    !passwordSetupRequired &&
    telegramStartRoute &&
    location.pathname !== telegramStartRoute &&
    canAccessUserDashboard(onboardingFlowStatus, onboardingCompleted)
  ) {
    return <Navigate to={telegramStartRoute} replace />;
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
      <Route
        path="/*"
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
