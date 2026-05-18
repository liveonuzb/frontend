import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GeneratingContainer,
  PersonalizingContainer,
} from "./personalization-loading.jsx";
import {
  buildLoadingStepStates,
  metabolismChecklist,
} from "../lib/personalization.js";

import { every, map, filter } from "lodash";

const getQueryResultMock = vi.hoisted(() => vi.fn());
const postQueryResultMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const setOnboardingFlowMock = vi.hoisted(() => vi.fn());
const paramsMock = vi.hoisted(() => vi.fn(() => ({ jobId: "job-1" })));

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, values) =>
      values?.defaultValue
        ? values.defaultValue
        : values?.value
          ? `${key}:${values.value}`
          : values?.step
            ? `${key}:${values.step}`
            : key,
  }),
}));

vi.mock("react-router", () => ({
  Navigate: ({ to, replace }) => {
    navigateMock(to, { replace });
    return <div data-testid="legacy-plan-generation-redirect" />;
  },
  useNavigate: () => navigateMock,
  useParams: () => paramsMock(),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => getQueryResultMock(...args),
  usePostQuery: (...args) => postQueryResultMock(...args),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({ setOnboardingFlow: setOnboardingFlowMock }),
}));

vi.mock("@/modules/onboarding/lib/onboarding-footer-context", () => ({
  useOnboardingFooter: vi.fn(),
}));

describe("PersonalizingContainer", () => {
  beforeEach(() => {
    getQueryResultMock.mockReset();
    postQueryResultMock.mockReset();
    navigateMock.mockReset();
    setOnboardingFlowMock.mockReset();
    paramsMock.mockReset();
    paramsMock.mockReturnValue({ jobId: "job-1" });
    document.documentElement.removeAttribute("data-app-mode");
    vi.useRealTimers();
  });

  it("maps metabolism progress into completed, active, and pending states", () => {
    const stepStates = buildLoadingStepStates(50, metabolismChecklist);
    const completedKeys = map(filter(stepStates, (step) => step.status === "completed"), (step) => step.key);

    expect(completedKeys).toEqual(["bmrFormula", "metabolicAge"]);
    expect(stepStates[2]).toMatchObject({
      key: "calorieMacros",
      status: "active",
    });
    expect(stepStates[3]).toMatchObject({
      key: "waterSteps",
      status: "pending",
    });

    expect(
      every(
        buildLoadingStepStates(100, metabolismChecklist),
        (step) => step.status === "completed",
      ),
    ).toBe(true);
  });

  it("uses the active metabolism job route after refresh", () => {
    const mutateAsync = vi.fn();
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          id: "job-1",
          status: "PROCESSING",
          progress: 38,
          flowStatus: "PERSONALIZING",
          nextPath: "/user/onboarding/metabolism-calculating/job-1",
        },
      },
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    });
    postQueryResultMock.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<PersonalizingContainer />);

    expect(getQueryResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/onboarding/metabolism-status/job-1",
      }),
    );
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redirects legacy plan generation screens to metabolism result without starting a plan job", () => {
    render(<GeneratingContainer />);

    expect(screen.getByTestId("legacy-plan-generation-redirect")).toBeTruthy();
    expect(navigateMock).toHaveBeenCalledWith(
      "/user/onboarding/metabolism-result",
      { replace: true },
    );
    expect(getQueryResultMock).not.toHaveBeenCalled();
    expect(postQueryResultMock).not.toHaveBeenCalled();
  });

  it("shows a visible recovery path when a metabolism job fails", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: "job-2",
          flowStatus: "PERSONALIZING",
          nextPath: "/user/onboarding/metabolism-calculating/job-2",
        },
      },
    });
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          id: "job-1",
          status: "FAILED",
          progress: 72,
          missingData: ["target weight"],
        },
      },
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    });
    postQueryResultMock.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<PersonalizingContainer />);

    expect(
      screen.getByText("onboarding.postOnboarding.loading.errorDescription"),
    ).toBeInTheDocument();
    expect(screen.getByText("- target weight")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.postOnboarding\.loading\.retry/,
      }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        url: "/user/onboarding/retry-personalization",
      });
    });
    expect(navigateMock).toHaveBeenCalledWith(
      "/user/onboarding/metabolism-calculating/job-2",
      { replace: true },
    );
  });
});
