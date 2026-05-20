import { get, some, toLower } from "lodash";
import { config } from "@/config.js";
import { getApiErrorMessage } from "@/lib/api-response.js";
import {
  canAccessUserDashboard,
  getPostOnboardingPath,
  getUserOnboardingPath,
} from "@/lib/app-paths.js";

const SENSITIVE_AUTH_ERROR_PATTERNS = [
  "prisma",
  "sql",
  "database",
  "public.",
  "stack",
  "invocation",
  "does not exist",
  "p20",
  " at ",
];

const isSensitiveAuthErrorMessage = (message) => {
  const normalizedMessage = toLower(String(message || ""));
  return some(SENSITIVE_AUTH_ERROR_PATTERNS, (pattern) =>
    normalizedMessage.includes(pattern),
  );
};

export const getAuthErrorMessage = (error, fallbackMessage) => {
  const message = getApiErrorMessage(error, fallbackMessage);

  if (message !== fallbackMessage && isSensitiveAuthErrorMessage(message)) {
    return fallbackMessage;
  }

  return message;
};

export const getAuthResponseData = (response) => {
  return get(response, "data.data");
};

export const getOtpToastDescription = (responseData, t) => {
  const otpCode = get(responseData, "otpCode");
  if (!otpCode || typeof t !== "function") {
    return undefined;
  }

  return t("auth.devOtpCode", { code: otpCode });
};

export const getPostAuthRoute = (user) => {
  if (get(user, "passwordSetupRequired")) {
    return "/auth/set-password";
  }

  const roles = get(user, "roles", []);

  if (some(roles, (role) => role === "SUPER_ADMIN")) {
    return "/admin/dashboard";
  }

  if (
    get(user, "onboardingCompleted") &&
    canAccessUserDashboard(
      get(user, "onboardingFlowStatus"),
      get(user, "onboardingCompleted"),
    )
  ) {
    return "/user";
  }

  if (get(user, "onboardingCompleted")) {
    return getPostOnboardingPath(user);
  }

  return getUserOnboardingPath();
};

export const getSocialAuthUrl = (provider) => {
  return `${config.baseURL}/auth/login/${provider}`;
};

export const handleSocialLogin = (provider) => {
  window.location.href = getSocialAuthUrl(provider);
};
