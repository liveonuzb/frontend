import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { HomeIcon } from "lucide-react";
import FeatureSubNav from "./feature-sub-nav.jsx";

vi.mock("@/hooks/app/use-mobile-chrome-hidden", () => ({
  useMobileChromeHidden: () => false,
}));

describe("FeatureSubNav", () => {
  it("does not reserve the old mobile header height when rendered as mobile tabs", () => {
    render(
      <MemoryRouter initialEntries={["/user/workout/overview"]}>
        <FeatureSubNav
          mobile
          items={[
            {
              to: "/user/workout/overview",
              label: "Overview",
              icon: HomeIcon,
            },
          ]}
        />
      </MemoryRouter>,
    );

    const nav = screen.getByRole("navigation");

    expect(nav).toHaveClass("top-1");
    expect(nav).not.toHaveClass("top-[68px]");
  });
});
