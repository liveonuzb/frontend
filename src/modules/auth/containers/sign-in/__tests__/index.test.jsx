import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import SignInContainer from "../index.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

vi.mock("@/modules/auth/containers/sign-in/phone-form.jsx", () => ({
  default: () => <div>phone-form</div>,
}));

const authState = vi.hoisted(() => ({
  clearPasswordReset: vi.fn(),
  clearPendingVerification: vi.fn(),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    typeof selector === "function" ? selector(authState) : authState,
}));

describe("SignInContainer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders phone sign-in without social provider buttons", () => {
    render(
      <MemoryRouter>
        <SignInContainer />
      </MemoryRouter>,
    );

    expect(screen.getByText("phone-form")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Login with Apple" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Login with Google" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Login with Meta" }),
    ).not.toBeInTheDocument();
  });
});
