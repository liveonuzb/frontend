import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import Layout from "./index.jsx";

const setFieldsMock = vi.hoisted(() => vi.fn());
const setLastVisitedPathMock = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: () => ({
    data: undefined,
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
  }),
  useOnboardingStore: () => ({
    setFields: setFieldsMock,
    setLastVisitedPath: setLastVisitedPathMock,
  }),
}));

vi.mock("../lib/use-draft-restore", () => ({
  useDraftRestore: () => ({
    isLoading: false,
  }),
}));

const PathProbe = () => {
  const location = useLocation();
  return <span data-testid="path">{location.pathname}</span>;
};

const renderOnboardingLayout = (initialPath) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/user/onboarding" element={<Layout />}>
          <Route
            path="result"
            element={
              <>
                <div>Result child</div>
                <PathProbe />
              </>
            }
          />
          <Route
            path="review"
            element={
              <>
                <div>Review child</div>
                <PathProbe />
              </>
            }
          />
          <Route path="personalizing" element={<div>Personalizing child</div>} />
          <Route path="generating" element={<div>Generating child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("Onboarding layout post-result behavior", () => {
  it("renders result with fixed onboarding header, 100% progress, and review back path", () => {
    const { container } = renderOnboardingLayout("/user/onboarding/result");
    const header = container.querySelector("header");

    expect(header).toBeTruthy();
    expect(header?.querySelector("[style]")).toHaveStyle({ width: "100%" });

    fireEvent.click(screen.getByRole("button", { name: "onboarding.back" }));

    expect(screen.getByText("Review child")).toBeTruthy();
    expect(screen.getByTestId("path")).toHaveTextContent(
      "/user/onboarding/review",
    );
  });

  it("keeps personalizing and generating screens without fixed onboarding header", () => {
    const personalizing = renderOnboardingLayout("/user/onboarding/personalizing");

    expect(personalizing.container.querySelector("header")).toBeNull();

    personalizing.unmount();

    const generating = renderOnboardingLayout("/user/onboarding/generating");

    expect(generating.container.querySelector("header")).toBeNull();
  });
});
