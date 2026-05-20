import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  getPreAuthRedirectPath,
  shouldShowTelegramAuthLoader,
} from "./route-guards.js";

describe("root router guards", () => {
  it("keeps public landing and referral traffic outside the pre-auth wizard", () => {
    expect(
      getPreAuthRedirectPath({
        isAuthenticated: false,
        isTelegramWebApp: false,
        hasSelectedLanguage: false,
        appMode: null,
        pathname: "/",
      }),
    ).toBeNull();
    expect(
      getPreAuthRedirectPath({
        isAuthenticated: false,
        isTelegramWebApp: false,
        hasSelectedLanguage: false,
        appMode: null,
        pathname: "/r/abc",
      }),
    ).toBeNull();
  });

  it("routes anonymous non-Telegram users through language then mode setup", () => {
    expect(
      getPreAuthRedirectPath({
        isAuthenticated: false,
        isTelegramWebApp: false,
        hasSelectedLanguage: false,
        appMode: null,
        pathname: "/user/onboarding/name",
      }),
    ).toBe("/auth/select-language");
    expect(
      getPreAuthRedirectPath({
        isAuthenticated: false,
        isTelegramWebApp: false,
        hasSelectedLanguage: true,
        appMode: null,
        pathname: "/auth/sign-in",
      }),
    ).toBe("/auth/select-mode");
  });

  it("does not pre-auth redirect authenticated or Telegram WebApp sessions", () => {
    expect(
      getPreAuthRedirectPath({
        isAuthenticated: true,
        isTelegramWebApp: false,
        hasSelectedLanguage: false,
        appMode: null,
        pathname: "/user/onboarding/name",
      }),
    ).toBeNull();
    expect(
      getPreAuthRedirectPath({
        isAuthenticated: false,
        isTelegramWebApp: true,
        hasSelectedLanguage: false,
        appMode: null,
        pathname: "/user/onboarding/name",
      }),
    ).toBeNull();
    expect(
      shouldShowTelegramAuthLoader({
        isAuthenticated: false,
        isTelegramWebApp: true,
        telegramAuthError: null,
      }),
    ).toBe(true);
  });

  it("centralizes the admin role allow-list", () => {
    expect(ADMIN_ROLES).toEqual([
      "SUPER_ADMIN",
    ]);
  });
});
