import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import PasswordForm from "../password-form.jsx";

const toastError = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const mutateAsync = vi.hoisted(() => vi.fn());
const completeAuthentication = vi.hoisted(() => vi.fn());
const clearAuthPhoneFlow = vi.hoisted(() => vi.fn());
const setTwoFactorChallenge = vi.hoisted(() => vi.fn());
const setQueryData = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
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
    clearAuthPhoneFlow,
    completeAuthentication,
    setTwoFactorChallenge,
  }),
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div>location:{location.pathname}</div>;
};

describe("PasswordForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows backend password-setup-required guidance during phone login", async () => {
    const backendMessage =
      "Password is not set yet. Please open the app through Telegram and set your password.";
    mutateAsync.mockImplementation(async (_request, handlers) => {
      handlers.onError({
        response: {
          data: {
            error: {
              message: backendMessage,
            },
          },
        },
      });
    });

    render(
      <MemoryRouter>
        <PasswordForm phone="+998901234567" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("auth.signIn.passwordLabel"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "auth.signIn.loginButton" }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(backendMessage);
    });
  });

  it("stores 2FA challenge instead of completing authentication", async () => {
    mutateAsync.mockImplementation(async (_request, handlers) => {
      handlers.onSuccess({
        data: {
          data: {
            twoFactorRequired: true,
            twoFactorToken: "challenge-token",
          },
        },
      });
    });

    render(
      <MemoryRouter>
        <PasswordForm phone="+998901234567" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("auth.signIn.passwordLabel"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "auth.signIn.loginButton" }),
    );

    await waitFor(() => {
      expect(setTwoFactorChallenge).toHaveBeenCalledWith({
        phone: "+998901234567",
        twoFactorToken: "challenge-token",
      });
    });
    expect(completeAuthentication).not.toHaveBeenCalled();
    expect(clearAuthPhoneFlow).not.toHaveBeenCalled();
  });

  it("announces the next action while login is in progress", async () => {
    mutateAsync.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <PasswordForm phone="+998901234567" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("auth.signIn.passwordLabel"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "auth.signIn.loginButton" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "auth.signIn.nextActionLoggingIn",
    );
  });

  it("completes authentication, primes me cache, and navigates after login", async () => {
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
            message: "Logged in.",
          },
        },
      });
    });

    render(
      <MemoryRouter initialEntries={["/auth/sign-in/password"]}>
        <Routes>
          <Route
            path="/auth/sign-in/password"
            element={<PasswordForm phone="+998901234567" />}
          />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("auth.signIn.passwordLabel"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "auth.signIn.loginButton" }),
    );

    await waitFor(() => {
      expect(completeAuthentication).toHaveBeenCalledWith({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user,
        roles: ["USER"],
        message: "Logged in.",
      });
    });
    expect(clearAuthPhoneFlow).toHaveBeenCalled();
    expect(setQueryData).toHaveBeenCalledWith(["me"], { data: user });
    expect(toastSuccess).toHaveBeenCalledWith("Logged in.");

    await waitFor(() => {
      expect(screen.getByText("location:/user")).toBeInTheDocument();
    });
  });
});
