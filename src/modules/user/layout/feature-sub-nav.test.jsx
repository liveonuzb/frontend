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
  const nutritionItems = [
    {
      to: "/user/nutrition/overview",
      label: "Obzor",
      icon: HomeIcon,
    },
    {
      to: "/user/nutrition/plans",
      label: "Plans",
      icon: HomeIcon,
    },
    {
      to: "/user/nutrition/recipes",
      label: "Recipes",
      icon: HomeIcon,
    },
  ];

  const renderFeatureNav = ({ mobile = false, variant } = {}) => {
    const view = render(
      <MemoryRouter initialEntries={["/user/nutrition/overview"]}>
        <FeatureSubNav
          mobile={mobile}
          variant={variant}
          items={nutritionItems}
        />
      </MemoryRouter>,
    );
    const surface = view.container.querySelector('[data-workout-tab="surface"]');
    const scrollArea = surface?.firstElementChild;
    const tabList = scrollArea?.firstElementChild;
    const activeLink = screen.getByRole("link", { name: /Obzor/i });

    return {
      ...view,
      nav: screen.getByRole("navigation"),
      surface,
      scrollArea,
      tabList,
      activeLink,
    };
  };

  const getNavClasses = ({ mobile = false, variant } = {}) => {
    const view = renderFeatureNav({ mobile, variant });
    const classes = {
      nav: view.nav.className,
      surface: view.surface.className,
      scrollArea: view.scrollArea?.className || "",
      active: view.activeLink.className,
    };

    view.unmount();

    return classes;
  };

  it("renders nutrition tabs with the same styles as workout tabs", () => {
    expect(getNavClasses({ mobile: true, variant: "nutrition" })).toEqual(
      getNavClasses({ mobile: true }),
    );
    expect(getNavClasses({ variant: "nutrition" })).toEqual(getNavClasses());
  });

  it("keeps desktop tabs in a single horizontal row", () => {
    const view = renderFeatureNav({ variant: "nutrition" });

    expect(view.surface).toHaveClass("rounded-[1.75rem]", "px-1", "py-1");
    expect(view.scrollArea).toHaveClass("overflow-x-auto", "no-scrollbar");
    expect(view.tabList).toHaveClass("flex-nowrap", "min-w-max");
    expect(view.tabList).not.toHaveClass("flex-wrap");
    expect(view.activeLink).toHaveClass("rounded-full", "bg-primary/10");
  });

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
