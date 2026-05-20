import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OtpForm from "../otp-form.jsx";

const mutateAsync = vi.hoisted(() => vi.fn());
const completeAuthentication = vi.hoisted(() => vi.fn());
const setPasswordReset = vi.hoisted(() => vi.fn());
const setPendingVerification = vi.hoisted(() => vi.fn());
const setQueryData = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  pendingVerification: {
    channel: "phone",
    purpose: "VERIFY_ACCOUNT",
    phone: "+998901234567",
    expiresAt: "2099-05-19T10:05:00.000Z",
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData,
  }),
}));

vi.mock("@/hooks/api", () => ({
  usePostQuery: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: () => ({
    completeAuthentication,
    pendingVerification: authState.pendingVerification,
    setPasswordReset,
    setPendingVerification,
  }),
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div>location:{location.pathname}</div>;
};

const renderOtpForm = () =>
  render(
    <MemoryRouter initialEntries={["/auth/otp-verify"]}>
      <Routes>
        <Route path="/auth/otp-verify" element={<OtpForm />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe("OtpForm", () => {
  beforeEach(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    delete globalThis.ResizeObserver;
    authState.pendingVerification = {
      channel: "phone",
      purpose: "VERIFY_ACCOUNT",
      phone: "+998901234567",
      expiresAt: "2099-05-19T10:05:00.000Z",
    };
  });

  it("blocks verification and enables resend when the OTP is expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T10:00:00.000Z"));
    authState.pendingVerification = {
      channel: "phone",
      purpose: "VERIFY_ACCOUNT",
      phone: "+998901234567",
      expiresAt: "2026-05-19T09:59:00.000Z",
    };

    renderOtpForm();

    expect(screen.getByText("auth.otpVerify.expired")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "auth.otpVerify.verifyButton" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "auth.otpVerify.resend" }),
    ).toBeEnabled();
  });

  it("exposes the OTP input with an accessible label", () => {
    renderOtpForm();

    const input = screen.getByLabelText("auth.otpVerify.codeLabel");

    expect(input).toHaveAttribute("id", "verification-code");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "verification-code-hint verification-code-error",
    );
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("completes authentication and redirects after account verification", async () => {
    const user = {
      id: "user-1",
      roles: ["USER"],
      onboardingCompleted: true,
      onboardingFlowStatus: "ACTIVATED",
    };
    completeAuthentication.mockReturnValue(true);
    mutateAsync.mockImplementation(async (_request, handlers) => {
      handlers.onSuccess({
        data: {
          data: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
            user,
            roles: ["USER"],
            message: "Verified.",
          },
        },
      });
    });

    renderOtpForm();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "123456" },
    });

    await waitFor(() => {
      expect(completeAuthentication).toHaveBeenCalledWith({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user,
        roles: ["USER"],
        message: "Verified.",
      });
    });
    expect(setQueryData).toHaveBeenCalledWith(["me"], { data: user });
    await waitFor(() => {
      expect(screen.getByText("location:/user")).toBeInTheDocument();
    });
  });

  it("stores reset token and redirects after password-reset OTP verification", async () => {
    authState.pendingVerification = {
      channel: "phone",
      purpose: "PASSWORD_RESET",
      phone: "+998901234567",
      expiresAt: "2099-05-19T10:05:00.000Z",
    };
    mutateAsync.mockImplementation(async (_request, handlers) => {
      handlers.onSuccess({
        data: {
          data: {
            resetToken: "reset-token",
            expiresAt: "2026-05-19T10:10:00.000Z",
            message: "Reset ready.",
          },
        },
      });
    });

    renderOtpForm();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "123456" },
    });

    await waitFor(() => {
      expect(setPasswordReset).toHaveBeenCalledWith({
        resetToken: "reset-token",
        expiresAt: "2026-05-19T10:10:00.000Z",
        phone: "+998901234567",
      });
    });
    expect(completeAuthentication).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByText("location:/auth/reset-password"),
      ).toBeInTheDocument();
    });
  });
});
