import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useAuthStore from "./auth-store.js";

const readPersistedAuthState = () =>
  JSON.parse(sessionStorage.getItem("auth-storage"))?.state;

describe("auth store persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T10:00:00.000Z"));
    sessionStorage.clear();
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    useAuthStore.getState().logout();
    sessionStorage.clear();
    localStorage.clear();
    vi.useRealTimers();
  });

  it("persists sanitized short-lived auth flow state for mobile reload recovery", () => {
    useAuthStore.getState().setPendingVerification({
      channel: "sms",
      purpose: "PASSWORD_RESET",
      phone: "+998901234567",
      otpCode: "123456",
      expiresAt: "2026-05-19T10:05:00.000Z",
    });
    useAuthStore.getState().setAuthPhoneFlow({
      phone: "+998901234567",
      flow: "login",
      referralCode: "LIVEON",
    });
    useAuthStore.getState().setPasswordReset({
      resetToken: "reset-token",
      phone: "+998901234567",
      expiresAt: "2026-05-19T10:10:00.000Z",
    });

    expect(readPersistedAuthState()).toMatchObject({
      pendingVerification: {
        channel: "sms",
        purpose: "PASSWORD_RESET",
        phone: "+998901234567",
        expiresAt: "2026-05-19T10:05:00.000Z",
      },
      authPhoneFlow: {
        phone: "+998901234567",
        flow: "login",
        referralCode: "LIVEON",
      },
      passwordReset: {
        resetToken: "reset-token",
        phone: "+998901234567",
        expiresAt: "2026-05-19T10:10:00.000Z",
      },
    });
    expect(readPersistedAuthState().pendingVerification).not.toHaveProperty(
      "otpCode",
    );
  });

  it("does not persist expired auth flow state", () => {
    useAuthStore.getState().setPendingVerification({
      purpose: "VERIFY_ACCOUNT",
      phone: "+998901234567",
      expiresAt: "2026-05-19T09:59:00.000Z",
    });
    useAuthStore.getState().setPasswordReset({
      resetToken: "reset-token",
      expiresAt: "2026-05-19T09:59:00.000Z",
    });

    expect(readPersistedAuthState()).toMatchObject({
      pendingVerification: null,
      passwordReset: null,
    });
  });

  it("rejects incomplete auth success payloads", () => {
    const result = useAuthStore.getState().completeAuthentication({
      twoFactorRequired: true,
      twoFactorToken: "challenge-token",
    });

    expect(result).toBe(false);
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      user: null,
      roles: [],
      activeRole: null,
    });
  });

  it("persists fresh 2FA challenge state for login reload recovery", () => {
    useAuthStore.getState().setTwoFactorChallenge({
      twoFactorToken: "challenge-token",
      phone: "+998901234567",
    });

    expect(readPersistedAuthState()).toMatchObject({
      twoFactorChallenge: {
        twoFactorToken: "challenge-token",
        phone: "+998901234567",
        expiresAt: "2026-05-19T10:15:00.000Z",
      },
    });
  });
});
