import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GeneratingContainer,
  PersonalizingContainer,
} from "./personalization-loading.jsx";
import {
  buildLoadingStepStates,
  planGenerationChecklist,
} from "../lib/personalization.js";

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
  useNavigate: () => navigateMock,
  useParams: () => paramsMock(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
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

  it("maps AI plan generation progress into completed, active, and pending states", () => {
    const stepStates = buildLoadingStepStates(50, planGenerationChecklist);
    const completedKeys = stepStates
      .filter((step) => step.status === "completed")
      .map((step) => step.key);

    expect(completedKeys).toEqual(["mealContext", "workoutContext"]);
    expect(stepStates[2]).toMatchObject({
      key: "mealPlan",
      status: "active",
    });
    expect(stepStates[3]).toMatchObject({
      key: "workoutPlan",
      status: "pending",
    });

    expect(
      buildLoadingStepStates(100, planGenerationChecklist).every(
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

  it("uses the active generation job route after refresh without starting a new plan", () => {
    paramsMock.mockReturnValue({ jobId: "generation-1" });
    const mutateAsync = vi.fn();
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          id: "generation-1",
          status: "PROCESSING",
          progress: 42,
          flowStatus: "GENERATING_PLAN",
          nextPath: "/user/onboarding/plan-generating/generation-1",
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

    render(<GeneratingContainer />);

    expect(getQueryResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/onboarding/generation-status/generation-1",
      }),
    );
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("renders the mode-aware AI plan generation shell with the current step", () => {
    document.documentElement.dataset.appMode = "focus";
    paramsMock.mockReturnValue({ jobId: "generation-1" });
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          id: "generation-1",
          status: "PROCESSING",
          progress: 50,
          flowStatus: "GENERATING_PLAN",
          nextPath: "/user/onboarding/plan-generating/generation-1",
        },
      },
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    });
    postQueryResultMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<GeneratingContainer />);

    expect(screen.getByTestId("ai-plan-generation")).toHaveClass(
      "ai-plan-generation",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    const activeStep = screen
      .getByText("onboarding.postOnboarding.loading.checklist.mealPlan")
      .closest("li");
    expect(activeStep).toHaveAttribute("aria-current", "step");
    expect(activeStep).toHaveClass("ai-plan-generation__step--active");
    expect(
      screen.getByText("onboarding.postOnboarding.loading.hintTitle"),
    ).toBeInTheDocument();
  });

  it("navigates to plan ready when plan generation completes", async () => {
    vi.useFakeTimers();
    paramsMock.mockReturnValue({ jobId: "generation-1" });
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          id: "generation-1",
          status: "COMPLETED",
          progress: 100,
          flowStatus: "PLAN_READY",
          nextPath: "/user/onboarding/plan-ready",
        },
      },
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    });
    postQueryResultMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<GeneratingContainer />);

    await vi.advanceTimersByTimeAsync(650);

    expect(navigateMock).toHaveBeenCalledWith("/user/onboarding/plan-ready", {
      replace: true,
    });
  });

  it("shows quality-gate issues when plan generation fails validation", () => {
    paramsMock.mockReturnValue({ jobId: "generation-1" });
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          id: "generation-1",
          status: "FAILED",
          progress: 100,
          missingData: [],
          qualityReport: {
            score: 72,
            passed: false,
            level: "blocked",
            blockingIssues: [
              {
                code: "nutrition.weekly_calories_out_of_range",
                message:
                  "Weekly average calories are outside the target tolerance.",
              },
            ],
            warnings: [],
            metrics: {},
          },
        },
      },
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    });
    postQueryResultMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    render(<GeneratingContainer />);

    const shell = screen.getByTestId("ai-plan-generation");
    expect(shell).toHaveClass("ai-plan-generation--error");
    expect(shell).not.toHaveClass("ai-plan-generation--complete");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "92",
    );
    expect(
      screen
        .getByText("onboarding.postOnboarding.loading.checklist.finalizing")
        .closest("li"),
    ).not.toHaveClass("ai-plan-generation__step--completed");
    expect(
      screen.getByText(
        "- Weekly average calories are outside the target tolerance.",
      ),
    ).toBeInTheDocument();
  });

  it("retries a failed generation job by starting a new plan job", async () => {
    paramsMock.mockReturnValue({ jobId: "generation-1" });
    const mutateAsync = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: "generation-2",
          flowStatus: "GENERATING_PLAN",
          nextPath: "/user/onboarding/plan-generating/generation-2",
        },
      },
    });
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          id: "generation-1",
          status: "FAILED",
          progress: 100,
          missingData: [],
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

    render(<GeneratingContainer />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.postOnboarding\.loading\.retry/,
      }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        url: "/user/onboarding/generate-personal-plan",
      });
    });
    expect(setOnboardingFlowMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingFlowStatus: "GENERATING_PLAN",
        onboardingNextPath: "/user/onboarding/plan-generating/generation-2",
        latestPlanGenerationJobId: "generation-2",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith(
      "/user/onboarding/plan-generating/generation-2",
      { replace: true },
    );
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
