import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunningLivePage from "./index.jsx";
import {
  useAppendRunningPoints,
  useCancelRunningSession,
  useFinishRunningSession,
  usePauseRunningSession,
  useResumeRunningSession,
  useRunningActiveSession,
} from "@/hooks/app/use-running-sessions";
import {
  clearRunningPointQueue,
  enqueueRunningPoints,
  loadActiveRunningSession,
  loadRunningPointQueue,
} from "@/lib/running-offline-queue";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useAppendRunningPoints: vi.fn(),
  useCancelRunningSession: vi.fn(),
  useFinishRunningSession: vi.fn(),
  usePauseRunningSession: vi.fn(),
  useResumeRunningSession: vi.fn(),
  useRunningActiveSession: vi.fn(),
}));

vi.mock("@/lib/running-offline-queue", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    clearRunningPointQueue: vi.fn(actual.clearRunningPointQueue),
    loadActiveRunningSession: vi.fn(),
    loadRunningPointQueue: vi.fn(actual.loadRunningPointQueue),
  };
});

vi.mock("../components/run-map-panel.jsx", () => ({
  default: ({ points }) => (
    <div
      data-testid="run-map-panel"
      data-point-count={points?.length ?? 0}
      data-last-sequence={points?.at(-1)?.sequence ?? ""}
    />
  ),
}));

const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/running/live/:workoutSessionId",
        element: <RunningLivePage />,
      },
      {
        path: "/user/workout/running/:workoutSessionId",
        element: <div>Run detail</div>,
      },
      {
        path: "/user/workout/running",
        element: <div>Running home</div>,
      },
    ],
    { initialEntries: ["/user/workout/running/live/workout-1"] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("RunningLivePage", () => {
  let appendPoints;
  let finishRunningSession;
  let watchSuccess;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    loadActiveRunningSession.mockReturnValue(null);
    appendPoints = vi.fn().mockResolvedValue({
      acceptedCount: 1,
      lastAcceptedSequence: 43,
    });
    finishRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
    });
    watchSuccess = null;

    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: vi.fn((success) => {
          watchSuccess = success;
          return 9;
        }),
        clearWatch: vi.fn(),
      },
    });

    useRunningActiveSession.mockReturnValue({
      activeSession: {
        workoutSessionId: "workout-1",
        status: "active",
        startedAt: "2026-05-12T10:00:00.000Z",
        lastAcceptedSequence: 42,
        metrics: {
          distanceMeters: 0,
          durationSeconds: 0,
        },
      },
    });
    useAppendRunningPoints.mockReturnValue({ appendPoints });
    usePauseRunningSession.mockReturnValue({
      pauseRunningSession: vi.fn(),
      isPending: false,
    });
    useResumeRunningSession.mockReturnValue({
      resumeRunningSession: vi.fn(),
      isPending: false,
    });
    useFinishRunningSession.mockReturnValue({
      finishRunningSession,
      isPending: false,
    });
    useCancelRunningSession.mockReturnValue({
      cancelRunningSession: vi.fn(),
      isPending: false,
    });
  });

  it("continues GPS point sequencing from the last accepted server sequence", async () => {
    renderPage();

    await act(async () => {
      await watchSuccess({
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:01:00.000Z"),
      });
    });

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalledWith("workout-1", [
        expect.objectContaining({
          sequence: 43,
          latitude: 41.311081,
          longitude: 69.240562,
        }),
      ]);
    });
    expect(loadRunningPointQueue).toHaveBeenCalledWith("workout-1");
    expect(clearRunningPointQueue).toHaveBeenCalledWith("workout-1");
    expect(screen.getByTestId("run-map-panel")).toHaveAttribute(
      "data-last-sequence",
      "43",
    );
  });

  it("updates live distance from browser GPS points before the run is finished", async () => {
    renderPage();

    await act(async () => {
      await watchSuccess({
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:01:00.000Z"),
      });
      await watchSuccess({
        coords: {
          latitude: 41.320081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:02:00.000Z"),
      });
    });

    expect(await screen.findByText("1.0 km")).toBeInTheDocument();
  });

  it("keeps the run open when queued points cannot sync before finish", async () => {
    appendPoints.mockRejectedValueOnce(new Error("offline"));
    enqueueRunningPoints("workout-1", [
      {
        sequence: 43,
        latitude: 41.311081,
        longitude: 69.240562,
        sourceTimestamp: "2026-05-12T10:01:00.000Z",
      },
    ]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /finish/i }));

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalledWith("workout-1", [
        expect.objectContaining({
          sequence: 43,
        }),
      ]);
    });
    expect(finishRunningSession).not.toHaveBeenCalled();
    expect(clearRunningPointQueue).not.toHaveBeenCalledWith("workout-1");
    expect(screen.getByText("Sync queued")).toBeInTheDocument();
  });

  it("continues GPS point sequencing from a locally saved active session after reload", async () => {
    useRunningActiveSession.mockReturnValue({
      activeSession: null,
    });
    loadActiveRunningSession.mockReturnValue({
      workoutSessionId: "workout-1",
      status: "active",
      startedAt: "2026-05-12T10:00:00.000Z",
      lastAcceptedSequence: 42,
      metrics: {
        distanceMeters: 0,
        durationSeconds: 0,
      },
    });
    renderPage();

    await act(async () => {
      await watchSuccess({
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:01:00.000Z"),
      });
    });

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalledWith("workout-1", [
        expect.objectContaining({
          sequence: 43,
          latitude: 41.311081,
          longitude: 69.240562,
        }),
      ]);
    });
  });
});
