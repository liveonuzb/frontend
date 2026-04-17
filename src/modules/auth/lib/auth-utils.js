import { get, join, trim, some, includes } from "lodash";
import { config } from "@/config.js";
import { getUserOnboardingPath } from "@/lib/app-paths.js";

export const getAuthErrorMessage = (error, fallbackMessage) => {
  const message = get(error, "response.data.message");

  if (Array.isArray(message)) {
    return join(message, ", ");
  }

  if (typeof message === "string" && trim(message)) {
    return message;
  }

  return fallbackMessage;
};

export const getOtpToastDescription = (responseData) => {
  const otpCode = get(responseData, "otpCode");
  if (!otpCode) {
    return undefined;
  }

  return `Dev OTP code: ${otpCode}`;
};

export const getPostAuthRoute = (user) => {
  if (get(user, "passwordSetupRequired")) {
    return "/auth/set-password";
  }

  const roles = get(user, "roles", []);

  if (some(roles, (role) => role === "SUPER_ADMIN")) {
    return "/admin/dashboard";
  }

  if (includes(roles, "COACH")) {
    return "/coach/dashboard";
  }

  return get(user, "onboardingCompleted") ? "/user" : getUserOnboardingPath();
};

export const getSocialAuthUrl = (provider) => {
  return `${config.baseURL}/auth/login/${provider}`;
};

export const handleSocialLogin = (provider) => {
  window.location.href = getSocialAuthUrl(provider);
};
