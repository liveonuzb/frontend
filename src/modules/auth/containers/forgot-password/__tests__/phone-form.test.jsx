import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import PhoneForm from "../phone-form.jsx";

const mutateAsync = vi.hoisted(() => vi.fn());
const setPendingVerification = vi.hoisted(() => vi.fn());
const clearPasswordReset = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: toastSuccess,
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
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
    clearPasswordReset,
    setPendingVerification,
  }),
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div>location:{location.pathname}</div>;
};

describe("ForgotPassword PhoneForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses neutral reset copy while preserving the OTP verification flow", async () => {
    mutateAsync.mockImplementation(async (_request, handlers) => {
      handlers.onSuccess({
        data: {
          data: {
            message: "Password reset OTP sent.",
            phone: "+998901234567",
            expiresAt: "2026-05-19T10:10:00.000Z",
          },
        },
      });
    });

    render(
      <MemoryRouter initialEntries={["/auth/forgot-password"]}>
        <Routes>
          <Route path="/auth/forgot-password" element={<PhoneForm />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "+998901234567" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "auth.forgotPassword.sendButton" }),
    );

    await waitFor(() => {
      expect(setPendingVerification).toHaveBeenCalledWith({
        channel: "phone",
        purpose: "PASSWORD_RESET",
        phone: "+998901234567",
        otpCode: undefined,
        expiresAt: "2026-05-19T10:10:00.000Z",
      });
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "auth.forgotPassword.neutralResetCodeSent",
      {
        description: undefined,
      },
    );
    expect(screen.getByText("location:/auth/otp-verify")).toBeInTheDocument();
  });
});
