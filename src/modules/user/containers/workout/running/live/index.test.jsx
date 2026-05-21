import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RunningLivePage from "./index.jsx";
import {
  useAppendRunningPoints,
  useBeginRunningSession,
  useCancelRunningSession,
  useFinishRunningSession,
  usePauseRunningSession,
  useResumeRunningSession,
  useRunningActiveSession,
  useRunningSessionDetail,
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

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => (typeof fallback === "string" ? fallback : _key),
  }),
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useAppendRunningPoints: vi.fn(),
  useBeginRunningSession: vi.fn(),
  useCancelRunningSession: vi.fn(),
  useFinishRunningSession: vi.fn(),
  usePauseRunningSession: vi.fn(),
  useResumeRunningSession: vi.fn(),
  useRunningActiveSession: vi.fn(),
  useRunningSessionDetail: vi.fn(),
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

const activeSession = (overrides = {}) => ({
  workoutSessionId: "workout-1",
  status: "active",
  startedAt: "2026-05-12T10:00:00.000Z",
  lastAcceptedSequence: 42,
  metrics: {
    distanceMeters: 0,
    durationSeconds: 0,
  },
  ...overrides,
});

const renderPage = (
  initialEntries = ["/user/workout/running/live/workout-1"],
) => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/running/live/:workoutSessionId",
        element: <RunningLivePage />,
      },
      {
        path: "/user/workout/running/live",
        element: <RunningLivePage />,
      },
      {
        path: "/user/workout/history/:workoutSessionId",
        element: <div>Workout history detail</div>,
      },
      {
        path: "/user/workout/running/:workoutSessionId",
        element: <div>Running detail route</div>,
      },
      {
        path: "/user/workout/overview",
        element: <div>Workout overview</div>,
      },
    ],
    { initialEntries },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("RunningLivePage", () => {
  let appendPoints;
  let beginRunningSession;
  let pauseRunningSession;
  let finishRunningSession;
  let resumeRunningSession;
  let cancelRunningSession;
  let watchSuccess;
  let watchError;
  let getCurrentSuccess;
  let getCurrentError;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    loadActiveRunningSession.mockReturnValue(null);
    appendPoints = vi.fn().mockResolvedValue({
      acceptedCount: 1,
      lastAcceptedSequence: 43,
    });
    beginRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
      status: "active",
      startedAt: "2026-05-12T10:00:03.000Z",
      lastAcceptedSequence: 42,
      metrics: {
        distanceMeters: 0,
        durationSeconds: 0,
      },
    });
    pauseRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
      status: "paused",
    });
    finishRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
    });
    resumeRunningSession = vi.fn().mockResolvedValue({
      workoutSessionId: "workout-1",
      status: "active",
      startedAt: "2026-05-12T10:00:00.000Z",
    });
    cancelRunningSession = vi.fn().mockResolvedValue({
      success: true,
    });
    watchSuccess = null;
    watchError = null;
    getCurrentSuccess = null;
    getCurrentError = null;

    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success, error) => {
          getCurrentSuccess = success;
          getCurrentError = error;
          success({
            coords: {
              latitude: 41.311081,
              longitude: 69.240562,
              altitude: 420,
              accuracy: 8,
              speed: 0,
              heading: 90,
            },
            timestamp: Date.parse("2026-05-12T10:00:00.000Z"),
          });
        }),
        watchPosition: vi.fn((success, error) => {
          watchSuccess = success;
          watchError = error;
          return 9;
        }),
        clearWatch: vi.fn(),
      },
    });

    useRunningActiveSession.mockReturnValue({
      activeSession: activeSession(),
    });
    useRunningSessionDetail.mockReturnValue({
      session: null,
      isLoading: false,
    });
    useAppendRunningPoints.mockReturnValue({ appendPoints });
    useBeginRunningSession.mockReturnValue({
      beginRunningSession,
      isPending: false,
    });
    usePauseRunningSession.mockReturnValue({
      pauseRunningSession,
      isPending: false,
    });
    useResumeRunningSession.mockReturnValue({
      resumeRunningSession,
      isPending: false,
    });
    useFinishRunningSession.mockReturnValue({
      finishRunningSession,
      isPending: false,
    });
    useCancelRunningSession.mockReturnValue({
      cancelRunningSession,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for START before starting countdown, begin, GPS watch, and timer flow", async () => {
    vi.useFakeTimers();
    useRunningActiveSession.mockReturnValue({
      activeSession: activeSession({
        status: "ready",
        startedAt: "2026-05-12T09:59:00.000Z",
      }),
    });

    renderPage();

    expect(window.navigator.geolocation.watchPosition).not.toHaveBeenCalled();
    expect(screen.getByText(/00:00(?::00)?/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^start$/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^END$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^RESUME$/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    expect(screen.getByText("3")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2400);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(beginRunningSession).toHaveBeenCalledWith(
        "workout-1",
        expect.objectContaining({
          startedAt: expect.any(String),
          firstPoint: expect.objectContaining({
            sequence: 43,
            segmentIndex: 0,
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(window.navigator.geolocation.watchPosition).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  it("requires a usable first GPS point before beginning a ready run", async () => {
    vi.useFakeTimers();
    useRunningActiveSession.mockReturnValue({
      activeSession: activeSession({
        status: "ready",
        startedAt: "2026-05-12T09:59:00.000Z",
      }),
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2400);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(beginRunningSession).toHaveBeenCalledWith("workout-1", {
        startedAt: expect.any(String),
        firstPoint: expect.objectContaining({
          sequence: 43,
          segmentIndex: 0,
          latitude: 41.311081,
          longitude: 69.240562,
          accuracy: 8,
          altitude: 420,
          speed: 0,
          heading: 90,
        }),
      });
    });
  });

  it("blocks begin when the first GPS fix is too weak", async () => {
    vi.useFakeTimers();
    useRunningActiveSession.mockReturnValue({
      activeSession: activeSession({
        status: "ready",
        startedAt: "2026-05-12T09:59:00.000Z",
      }),
    });
    window.navigator.geolocation.getCurrentPosition.mockImplementationOnce(
      (success) => {
        success({
          coords: {
            latitude: 41.311081,
            longitude: 69.240562,
            altitude: null,
            accuracy: 140,
            speed: null,
            heading: null,
          },
          timestamp: Date.parse("2026-05-12T10:00:00.000Z"),
        });
      },
    );

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2400);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });
    expect(beginRunningSession).not.toHaveBeenCalled();
    expect(await screen.findByText("GPS signali zaif")).toBeInTheDocument();
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
    await waitFor(() => {
      expect(loadRunningPointQueue("workout-1")).toEqual([]);
    });
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
        timestamp: Date.parse("2026-05-12T10:03:00.000Z"),
      });
    });

    expect(await screen.findByText("1.00")).toBeInTheDocument();
  });

  it("renders live without the top app bar and keeps END/RESUME controls visible after start", () => {
    renderPage();

    expect(
      screen.queryByRole("button", { name: /bekor qilish/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^END$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^RESUME$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /pauza/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /yakunlash/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the GPS status pill width stable as labels change", async () => {
    renderPage();

    const gpsPill = screen
      .getByText("GPS kutilmoqda")
      .closest('[role="status"]');
    expect(gpsPill).toHaveClass("w-[13rem]", "sm:w-[14.5rem]");

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
      expect(
        screen.getByText("GPS ulandi").closest('[role="status"]'),
      ).toHaveClass("w-[13rem]", "sm:w-[14.5rem]");
    });
  });

  it("opens a bottom finish drawer and lets the user continue the run", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^END$/i }));

    expect(
      screen.getByRole("dialog", { name: /finish training/i }),
    ).toBeInTheDocument();
    expect(finishRunningSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: /finish training/i }),
      ).toHaveAttribute("data-state", "closed");
    });
    expect(finishRunningSession).not.toHaveBeenCalled();
  });

  it("preserves queued GPS points when pre-finish sync fails", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: /^END$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    await waitFor(() => {
      expect(appendPoints).toHaveBeenCalledWith("workout-1", [
        expect.objectContaining({ sequence: 43 }),
      ]);
    });
    expect(finishRunningSession).not.toHaveBeenCalled();
    expect(clearRunningPointQueue).not.toHaveBeenCalledWith("workout-1");
    expect(loadRunningPointQueue("workout-1")).toEqual([
      expect.objectContaining({
        sequence: 43,
        latitude: 41.311081,
      }),
    ]);
    expect(
      screen.getByText(/GPS nuqtalar hali saqlanmadi/i),
    ).toBeInTheDocument();
  });

  it("returns to Workout Overview when the live route has no active session id", async () => {
    useRunningActiveSession.mockReturnValue({
      activeSession: null,
    });

    renderPage(["/user/workout/running/live"]);

    fireEvent.click(screen.getByRole("button", { name: /yugurishni boshlashga qaytish/i }));

    expect(await screen.findByText("Workout overview")).toBeInTheDocument();
  });

  it("ignores stale GPS callbacks during finish after tracking is stopped", async () => {
    let resolveFinish;
    finishRunningSession.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFinish = resolve;
        }),
    );
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^END$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    await waitFor(() => {
      expect(window.navigator.geolocation.clearWatch).toHaveBeenCalledWith(9);
    });

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
        timestamp: Date.parse("2026-05-12T10:03:00.000Z"),
      });
    });

    expect(appendPoints).not.toHaveBeenCalled();
    expect(finishRunningSession).toHaveBeenCalledWith(
      "workout-1",
      expect.objectContaining({
        finalPointSequence: 42,
        finishedAt: expect.any(String),
      }),
    );

    await act(async () => {
      resolveFinish({ workoutSessionId: "workout-1" });
    });
  });

  it("clears the geolocation watcher on pause and restarts it only after resume succeeds", async () => {
    let resolveResume;
    resumeRunningSession.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveResume = resolve;
        }),
    );
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^RESUME$/i }));

    await waitFor(() => {
      expect(pauseRunningSession).toHaveBeenCalledWith("workout-1");
    });
    expect(await screen.findByText("Pauzada")).toBeInTheDocument();
    expect(window.navigator.geolocation.clearWatch).toHaveBeenCalledWith(9);

    fireEvent.click(screen.getByRole("button", { name: /^RESUME$/i }));

    await waitFor(() => {
      expect(resumeRunningSession).toHaveBeenCalledWith("workout-1");
    });
    expect(window.navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveResume({
        workoutSessionId: "workout-1",
        status: "active",
      });
    });

    await waitFor(() => {
      expect(window.navigator.geolocation.watchPosition).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  it("starts a new route segment after pause and resume", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^RESUME$/i }));

    await waitFor(() => {
      expect(pauseRunningSession).toHaveBeenCalledWith("workout-1");
    });

    fireEvent.click(screen.getByRole("button", { name: /^RESUME$/i }));

    await waitFor(() => {
      expect(resumeRunningSession).toHaveBeenCalledWith("workout-1");
    });
    await waitFor(() => {
      expect(window.navigator.geolocation.watchPosition).toHaveBeenCalledTimes(
        2,
      );
    });

    await act(async () => {
      await watchSuccess({
        coords: {
          latitude: 41.320081,
          longitude: 69.240562,
          altitude: null,
          accuracy: 8,
          speed: null,
          heading: null,
        },
        timestamp: Date.parse("2026-05-12T10:04:00.000Z"),
      });
    });

    await waitFor(() => {
      expect(appendPoints).toHaveBeenLastCalledWith("workout-1", [
        expect.objectContaining({
          segmentIndex: 1,
          latitude: 41.320081,
        }),
      ]);
    });
  });

  it("does not expose the old cancel menu from the removed top bar", () => {
    renderPage();

    expect(
      screen.queryByRole("button", { name: /bekor qilish/i }),
    ).not.toBeInTheDocument();
    expect(cancelRunningSession).not.toHaveBeenCalled();
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

  it("lets the user retry GPS watching after a permission or timeout error", async () => {
    renderPage();

    act(() => {
      watchError({ code: 1 });
    });

    expect(screen.getByText("GPS ruxsati kerak")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /gps qayta urinish/i }));

    await waitFor(() => {
      expect(window.navigator.geolocation.watchPosition).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  it("shows GPS unavailable when active tracking cannot access geolocation", () => {
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {},
    });

    renderPage();

    expect(screen.getByText("GPS mavjud emas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /gps qayta urinish/i }),
    ).toBeInTheDocument();
  });
});
