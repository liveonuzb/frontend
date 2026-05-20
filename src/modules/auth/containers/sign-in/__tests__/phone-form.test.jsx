import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import PhoneForm from "../phone-form.jsx";

const mutateAsync = vi.hoisted(() => vi.fn());
const setAuthPhoneFlow = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
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
  useAuthStore: () => setAuthPhoneFlow,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div>location:{location.pathname}</div>;
};

const renderPhoneForm = () =>
  render(
    <MemoryRouter initialEntries={["/auth/sign-in"]}>
      <Routes>
        <Route path="/auth/sign-in" element={<PhoneForm />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe("PhoneForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("stores login phone flow and navigates to password login", async () => {
    mutateAsync.mockImplementation(async (_request, handlers) => {
      handlers.onSuccess({
        data: {
          data: {
            flow: "login",
            phone: "+998901234567",
          },
        },
      });
    });

    renderPhoneForm();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "+998901234567" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "auth.signIn.continueButton" }),
    );

    await waitFor(() => {
      expect(setAuthPhoneFlow).toHaveBeenCalledWith({
        phone: "+998901234567",
        flow: "login",
        referralCode: undefined,
      });
    });
    expect(screen.getByText("location:/auth/sign-in/password")).toBeInTheDocument();
  });

  it("stores register phone flow and navigates to sign up", async () => {
    mutateAsync.mockImplementation(async (_request, handlers) => {
      handlers.onSuccess({
        data: {
          data: {
            flow: "register",
            phone: "+998901234568",
          },
        },
      });
    });

    renderPhoneForm();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "+998901234568" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "auth.signIn.continueButton" }),
    );

    await waitFor(() => {
      expect(setAuthPhoneFlow).toHaveBeenCalledWith({
        phone: "+998901234568",
        flow: "register",
        referralCode: undefined,
      });
    });
    expect(screen.getByText("location:/auth/sign-up")).toBeInTheDocument();
  });
});
