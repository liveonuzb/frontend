import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./index.jsx";

import { forEach } from "lodash";

const setFieldsMock = vi.hoisted(() => vi.fn());
const setLastVisitedPathMock = vi.hoisted(() => vi.fn());
const getQueryResultMock = vi.hoisted(() => vi.fn());
const onboardingStoreStateMock = vi.hoisted(() => ({ value: {} }));

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, values) => {
      if (key === "onboarding.progress.label") {
        return `${values.current}/${values.total} - ${values.section}`;
      }

      if (key.startsWith("onboarding.progress.sections.")) {
        return key.replace("onboarding.progress.sections.", "");
      }

      return key;
    },
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => getQueryResultMock(...args),
}));

vi.mock("@/store", () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
  }),
  useOnboardingStore: () => ({
    setFields: setFieldsMock,
    setLastVisitedPath: setLastVisitedPathMock,
    ...onboardingStoreStateMock.value,
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
            path="name"
            element={
              <>
                <div>Name child</div>
                <PathProbe />
              </>
            }
          />
          <Route
            path="gender"
            element={
              <>
                <div>Gender child</div>
                <PathProbe />
              </>
            }
          />
          <Route
            path="age"
            element={
              <>
                <div>Age child</div>
                <PathProbe />
              </>
            }
          />
          <Route
            path="height"
            element={
              <>
                <div>Height child</div>
                <PathProbe />
              </>
            }
          />
          <Route
            path="current-weight"
            element={
              <>
                <div>Current weight child</div>
                <PathProbe />
              </>
            }
          />
          <Route
            path="target-weight"
            element={
              <>
                <div>Target weight child</div>
                <PathProbe />
              </>
            }
          />
          <Route
            path="goal"
            element={
              <>
                <div>Goal child</div>
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
          <Route
            path="diet-requirements"
            element={
              <>
                <div>Diet requirements child</div>
                <PathProbe />
              </>
            }
          />
          <Route
            path="metabolism-calculating"
            element={<div>Metabolism child</div>}
          />
          <Route
            path="metabolism-result"
            element={
              <>
                <div>Metabolism result child</div>
                <PathProbe />
              </>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("Onboarding layout post-result behavior", () => {
  beforeEach(() => {
    setFieldsMock.mockClear();
    setLastVisitedPathMock.mockClear();
    getQueryResultMock.mockReturnValue({ data: undefined });
    onboardingStoreStateMock.value = {};
  });

  it("renders metabolism result without the shared onboarding header", () => {
    const { container } = renderOnboardingLayout(
      "/user/onboarding/metabolism-result",
    );

    expect(container.querySelector("header")).toBeNull();
    expect(screen.queryByText("Onboarding yakuniy bosqichi")).toBeNull();
    expect(screen.queryByText("Yakuniy")).toBeNull();
    expect(container.querySelector("main")).toHaveClass("pb-0");
    expect(container.querySelector("main")).not.toHaveClass(
      "pt-[calc(88px+env(safe-area-inset-top))]",
    );
    expect(container.querySelector("footer")).toHaveClass("px-0");
    expect(container.querySelector("footer")).toHaveClass("pb-0");
    expect(container.querySelector("footer")).toHaveClass("pt-0");
  });

  it("uses the review return path when editing a step from review", () => {
    renderOnboardingLayout({
      pathname: "/user/onboarding/goal",
      state: { returnTo: "/user/onboarding/review" },
    });

    fireEvent.click(screen.getByRole("button", { name: "onboarding.back" }));

    expect(screen.getByText("Review child")).toBeTruthy();
    expect(screen.getByTestId("path")).toHaveTextContent(
      "/user/onboarding/review",
    );
  });

  it("maps only canonical user routes to step progress", () => {
    renderOnboardingLayout("/user/onboarding/diet-requirements");

    expect(
      screen.getByRole("progressbar", {
        name: "11/13 - nutrition",
      }),
    ).toHaveAttribute("aria-valuenow", "11");
  });

  it("shows retry guidance when draft auto-save fails", () => {
    onboardingStoreStateMock.value = {
      draftSaveStatus: "error",
      draftSaveError: "Network failed",
    };

    renderOnboardingLayout("/user/onboarding/review");

    expect(screen.getByText("onboarding.autosave.errorRetry")).toBeTruthy();
  });

  it("allows user onboarding pages to use natural vertical scroll at the shell level", () => {
    const { container } = renderOnboardingLayout("/user/onboarding/goal");
    const main = container.querySelector("main");

    expect(main).toHaveClass("overflow-x-hidden");
    expect(main).not.toHaveClass("overflow-hidden");
  });

  it("reserves mobile safe area for the fixed progress header", () => {
    const { container } = renderOnboardingLayout("/user/onboarding/name");

    expect(container.querySelector("header")).toHaveClass(
      "pt-[calc(1rem+env(safe-area-inset-top))]",
    );
    expect(container.querySelector("main")).toHaveClass(
      "pt-[calc(88px+env(safe-area-inset-top))]",
    );
  });

  it("uses the same safe-area footer reserve on standard onboarding steps", () => {
    forEach(
      ["name", "gender", "age", "height", "current-weight", "target-weight", "review"],
      (step) => {
        const route = renderOnboardingLayout(`/user/onboarding/${step}`);
        const main = route.container.querySelector("main");

        expect(main).toHaveClass(
          "pb-[calc(5rem+env(safe-area-inset-bottom))]",
        );
        expect(main).not.toHaveClass(
          "pb-[calc(5.25rem+env(safe-area-inset-bottom))]",
        );
        expect(main).not.toHaveClass(
          "pb-[calc(6rem+env(safe-area-inset-bottom))]",
        );
        expect(main).not.toHaveClass(
          "pb-[calc(8rem+env(safe-area-inset-bottom))]",
        );

        route.unmount();
      },
    );
  });

  it("uses one fixed safe-area footer height on the name step", () => {
    const { container } = renderOnboardingLayout("/user/onboarding/name");
    const footer = container.querySelector("footer");

    expect(footer).toHaveClass(
      "h-[calc(5rem+env(safe-area-inset-bottom))]",
    );
    expect(footer).toHaveClass("px-4");
    expect(footer).toHaveClass("pb-[calc(1rem+env(safe-area-inset-bottom))]");
    expect(footer).toHaveClass("pt-3");
    expect(footer).not.toHaveClass("px-3");
    expect(footer).not.toHaveClass(
      "pb-[calc(0.5rem+env(safe-area-inset-bottom))]",
    );
  });

  it("does not use dense footer reserve for numeric picker steps", () => {
    forEach(["age", "height", "current-weight", "target-weight"], (step) => {
      const dense = renderOnboardingLayout(`/user/onboarding/${step}`);
      const denseMain = dense.container.querySelector("main");

      expect(denseMain).toHaveClass(
        "pb-[calc(5rem+env(safe-area-inset-bottom))]",
      );
      expect(denseMain).not.toHaveClass(
        "pb-[calc(5.25rem+env(safe-area-inset-bottom))]",
      );

      dense.unmount();
    });
  });

  it("keeps the default footer reserve on multi-content steps", () => {
    const defaultReserve = renderOnboardingLayout("/user/onboarding/review");
    const defaultMain = defaultReserve.container.querySelector("main");

    expect(defaultMain).toHaveClass(
      "pb-[calc(5rem+env(safe-area-inset-bottom))]",
    );
    expect(defaultMain).not.toHaveClass(
      "pb-[calc(8rem+env(safe-area-inset-bottom))]",
    );
  });

  it("keeps metabolism calculating screens without fixed onboarding header", () => {
    const personalizing = renderOnboardingLayout(
      "/user/onboarding/metabolism-calculating",
    );

    expect(personalizing.container.querySelector("header")).toBeNull();
  });

  it("hydrates persisted user onboarding when server draft is empty", async () => {
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          userOnboardingDraft: {
            data: {
              firstName: "",
              gender: "",
              weeklyPace: 0.5,
              workoutLocation: "home",
              height: { value: "", unit: "cm" },
            },
          },
          userOnboarding: {
            firstName: "Berlin",
            lastName: "Germany",
            gender: "male",
            age: 33,
            height: { value: 173, unit: "cm" },
            currentWeight: { value: 67, unit: "kg" },
            goal: "maintain",
            mealFrequency: "3",
          },
        },
      },
    });

    renderOnboardingLayout("/user/onboarding/review");

    await waitFor(() => {
      expect(setFieldsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Berlin",
          lastName: "Germany",
          gender: "male",
          age: "33",
          height: { value: "173", unit: "cm" },
          currentWeight: { value: "67", unit: "kg" },
          goal: "maintain",
          mealFrequency: "3",
        }),
      );
    });
  });
});
