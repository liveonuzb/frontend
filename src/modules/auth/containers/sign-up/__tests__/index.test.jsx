import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGetQuery } from "@/hooks/api";
import SignUpContainer from "../index.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => {
      if (key === "auth.signUp.referralInvitedByName") {
        return `invited:${options.name}`;
      }
      if (key === "auth.signUp.referralInvited") {
        return "invited";
      }
      return options.defaultValue || key;
    },
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/modules/auth/containers/sign-up/phone-form.jsx", () => ({
  default: ({ referralCode }) => <div>phone-form:{referralCode}</div>,
}));

describe("SignUpContainer referral banner", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the inviter banner for valid referral codes", () => {
    vi.mocked(useGetQuery).mockReturnValue({
      data: {
        data: {
          valid: true,
          referrerName: "Coach One",
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/auth/sign-up?ref=coach-code"]}>
        <SignUpContainer />
      </MemoryRouter>,
    );

    expect(screen.getByText("invited:Coach One")).toBeInTheDocument();
    expect(screen.getByText("phone-form:coach-code")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign up with Apple" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign up with Google" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign up with Meta" }),
    ).not.toBeInTheDocument();
  });

  it("does not show the inviter banner for invalid referral codes", () => {
    vi.mocked(useGetQuery).mockReturnValue({
      data: {
        data: {
          valid: false,
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/auth/sign-up?ref=bad-code"]}>
        <SignUpContainer />
      </MemoryRouter>,
    );

    expect(screen.queryByText("invited")).not.toBeInTheDocument();
    expect(screen.getByText("phone-form:bad-code")).toBeInTheDocument();
  });
});
