import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlanReadyPage from ".";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router", () => ({
  Navigate: ({ to, replace }) => {
    navigateMock(to, { replace });
    return <div data-testid="legacy-plan-ready-redirect" />;
  },
}));

describe("PlanReadyPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("redirects legacy plan-ready URLs to the user dashboard", () => {
    render(<PlanReadyPage />);

    expect(screen.getByTestId("legacy-plan-ready-redirect")).toBeTruthy();
    expect(navigateMock).toHaveBeenCalledWith("/user/dashboard", {
      replace: true,
    });
  });
});
