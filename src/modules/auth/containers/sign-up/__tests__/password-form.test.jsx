import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePostQuery } from "@/hooks/api";
import PasswordForm from "../password-form.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

vi.mock("@/hooks/api", () => ({
  usePostQuery: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  authPhoneFlow: {
    phone: "+998901234567",
    flow: "register",
    referralCode: null,
  },
  clearAuthPhoneFlow: vi.fn(),
  clearPasswordReset: vi.fn(),
  setPendingVerification: vi.fn(),
}));

vi.mock("@/store", () => ({
  useAuthStore: () => authState,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div>location:{location.pathname}</div>;
};

describe("SignUp PasswordForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps phone flow until OTP page after successful registration", async () => {
    const mutateAsync = vi.fn(async (_payload, options) => {
      options.onSuccess({
        data: {
          data: {
            phone: "+998901234567",
            otpCode: "123456",
            expiresAt: "2026-05-03T12:00:00.000Z",
          },
        },
      });
    });
    vi.mocked(usePostQuery).mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(
      <MemoryRouter initialEntries={["/auth/sign-up"]}>
        <Routes>
          <Route
            path="/auth/sign-up"
            element={<PasswordForm phone="+998901234567" />}
          />
          <Route path="/auth/otp-verify" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("auth.signIn.newPasswordLabel"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(
      screen.getByLabelText("auth.signIn.confirmPasswordLabel"),
      {
        target: { value: "Password123!" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "auth.signIn.createPasswordButton",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("location:/auth/otp-verify")).toBeInTheDocument();
    });

    expect(authState.setPendingVerification).toHaveBeenCalledWith({
      channel: "phone",
      purpose: "VERIFY_ACCOUNT",
      phone: "+998901234567",
      otpCode: "123456",
      expiresAt: "2026-05-03T12:00:00.000Z",
    });
    expect(authState.clearAuthPhoneFlow).not.toHaveBeenCalled();
  });

  it("announces that OTP verification is the next action while creating account", async () => {
    const mutateAsync = vi.fn(() => new Promise(() => {}));
    vi.mocked(usePostQuery).mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(
      <MemoryRouter>
        <PasswordForm phone="+998901234567" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("auth.signIn.newPasswordLabel"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(
      screen.getByLabelText("auth.signIn.confirmPasswordLabel"),
      {
        target: { value: "Password123!" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "auth.signIn.createPasswordButton",
      }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "auth.signUp.nextActionSendingOtp",
    );
  });
});
