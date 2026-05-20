import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import TwoFactorForm from "./two-factor-form.jsx";

const mutateAsync = vi.hoisted(() => vi.fn());

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
    clearTwoFactorChallenge: vi.fn(),
    completeAuthentication: vi.fn(),
  }),
}));

describe("TwoFactorForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("links the 2FA code input to accessible hint and error regions", () => {
    render(
      <MemoryRouter>
        <TwoFactorForm twoFactorToken="challenge-token" />
      </MemoryRouter>,
    );

    const input = screen.getByLabelText("auth.signIn.twoFactorCodeLabel");

    expect(input).toHaveAttribute("id", "two-factor-code");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "two-factor-code-hint two-factor-code-error",
    );
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("submits backup codes as a 2FA fallback", async () => {
    mutateAsync.mockImplementation(async () => {});

    render(
      <MemoryRouter>
        <TwoFactorForm twoFactorToken="challenge-token" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("auth.signIn.twoFactorCodeLabel"), {
      target: { value: "A1B2C3D4" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "auth.signIn.twoFactorVerifyButton",
      }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        {
          url: "/auth/login/2fa/verify",
          attributes: {
            twoFactorToken: "challenge-token",
            code: "A1B2C3D4",
          },
        },
        expect.any(Object),
      );
    });
  });
});
