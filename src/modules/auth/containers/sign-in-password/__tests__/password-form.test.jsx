import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import PasswordForm from "../password-form.jsx";

const toastError = vi.hoisted(() => vi.fn());
const mutateAsync = vi.hoisted(() => vi.fn());
const completeAuthentication = vi.hoisted(() => vi.fn());
const clearAuthPhoneFlow = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
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
    setQueryData: vi.fn(),
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
  }),
}));

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
});
