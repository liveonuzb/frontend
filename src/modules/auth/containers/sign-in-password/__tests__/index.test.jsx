import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import SignInPasswordContainer from "../index.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => {
      if (options.phone) return `${key}:${options.phone}`;
      return options.defaultValue || key;
    },
  }),
}));

vi.mock("@/modules/auth/containers/sign-in-password/password-form.jsx", () => ({
  default: ({ phone }) => <div>password-form:{phone}</div>,
}));

const authState = vi.hoisted(() => ({
  authPhoneFlow: {
    phone: "+998901234567",
    flow: "login",
  },
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    typeof selector === "function" ? selector(authState) : authState,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div>location:{location.pathname}</div>;
};

describe("SignInPasswordContainer", () => {
  afterEach(() => {
    vi.clearAllMocks();
    authState.authPhoneFlow = {
      phone: "+998901234567",
      flow: "login",
    };
  });

  it("renders password form for login phone flow", () => {
    render(
      <MemoryRouter initialEntries={["/auth/sign-in/password"]}>
        <SignInPasswordContainer />
      </MemoryRouter>,
    );

    expect(screen.getByText("password-form:+998901234567")).toBeInTheDocument();
  });

  it("redirects to sign-in when phone flow is missing", () => {
    authState.authPhoneFlow = null;

    render(
      <MemoryRouter initialEntries={["/auth/sign-in/password"]}>
        <Routes>
          <Route
            path="/auth/sign-in/password"
            element={<SignInPasswordContainer />}
          />
          <Route path="/auth/sign-in" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("location:/auth/sign-in")).toBeInTheDocument();
  });
});
