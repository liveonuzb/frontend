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
import { toast } from "sonner";
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
import { useWorkoutWeatherToday } from "@/hooks/app/use-workout-weather";
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

vi.mock("@/hooks/app/use-workout-weather", () => ({
  useWorkoutWeatherToday: vi.fn(),
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
  default: ({ emptyLabel, points }) => (
    <div
      data-testid="run-map-panel"
      data-empty-label={emptyLabel ?? ""}
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
    useWorkoutWeatherToday.mockReturnValue({
      weather: {
        temperatureC: null,
        humidity: null,
      },
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
    expect(screen.getByRole("button", { name: /^start$/i })).toHaveAttribute(
      "data-slot",
      "button",
    );
    expect(
      screen.queryByRole("button", { name: /start qilish/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^pause$/i }),
    ).not.toBeInTheDocument();
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

  it("uses a first GPS point when beginning a ready run", async () => {
    vi.useFakeTimers();
    useRunningActiveSession.mockReturnValue({
      activeSession: activeSession({
        status: "ready",
        startedAt: "2026-05-12T09:59:00.000Z",
      }),
    });

    renderPage();

    const startButton = screen.getByRole("button", { name: /^start$/i });
    expect(startButton).toHaveAttribute("data-slot", "button");
    expect(startButton).toHaveClass("size-20");
    expect(startButton).not.toHaveClass("size-32", "sm:size-36");

    fireEvent.click(startButton);

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

  it("starts the run when the first GPS fix is weak and marks GPS weak", async () => {
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
    await waitFor(() => {
      expect(beginRunningSession).toHaveBeenCalledWith("workout-1", {
        startedAt: expect.any(String),
        firstPoint: expect.objectContaining({
          sequence: 43,
          segmentIndex: 0,
          latitude: 41.311081,
          longitude: 69.240562,
          accuracy: 140,
        }),
      });
    });
    expect(await screen.findByText("GPS signali zaif")).toBeInTheDocument();
  });

  it("starts the run without a first GPS point when geolocation is unavailable", async () => {
    vi.useFakeTimers();
    useRunningActiveSession.mockReturnValue({
      activeSession: activeSession({
        status: "ready",
        startedAt: "2026-05-12T09:59:00.000Z",
      }),
    });
    window.navigator.geolocation.getCurrentPosition.mockImplementationOnce(
      (_success, error) => {
        error({ code: 2, message: "Geolocation unavailable" });
      },
    );

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2400);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(beginRunningSession).toHaveBeenCalledWith("workout-1", {
        startedAt: expect.any(String),
      });
    });
    expect(await screen.findByText("GPS mavjud emas")).toBeInTheDocument();
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

  it("renders live without the top app bar and shows top-right pause after start", () => {
    renderPage();

    expect(
      screen.queryByRole("button", { name: /bekor qilish/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Outdoor Run" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^start$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start qilish/i }),
    ).not.toBeInTheDocument();
    const pauseButton = screen.getByRole("button", { name: /^pause$/i });
    expect(pauseButton).toHaveAttribute("data-slot", "button");
    expect(pauseButton).not.toHaveClass("h-14", "text-base");
    expect(
      screen.queryByRole("button", { name: /^END$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^resume$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /yakunlash/i }),
    ).not.toBeInTheDocument();
  });

  it("uses compact layout-safe sizing when rendered inside the user workout layout", () => {
    renderPage();

    const page = screen.getByTestId("running-live-page");
    const startButton = screen.queryByRole("button", { name: /^start$/i });
    const mapSection = screen.getByTestId("run-map-panel").closest("section");
    const heading = screen.getByRole("heading", { name: "Outdoor Run" });
    const header = heading.closest("header");
    const weatherRow = screen.getByText("--°").closest("div");
    const distanceMetric = screen.getByText("0.00");

    expect(page).toHaveClass(
      "min-h-[calc(100dvh-7rem)]",
      "bg-transparent",
      "px-4",
      "pb-28",
      "pt-3",
    );
    expect(header).toHaveClass("mb-3");
    expect(header).not.toHaveClass("mb-7", "px-2");
    expect(heading).toHaveClass("truncate", "text-[1.05rem]");
    expect(weatherRow).toHaveClass("text-xs");
    expect(mapSection).toHaveClass(
      "min-h-[330px]",
      "rounded-[1.65rem]",
      "sm:rounded-[2rem]",
    );
    expect(distanceMetric).toHaveClass(
      "text-[1.18rem]",
      "font-semibold",
    );
    expect(screen.getByText("Pace")).toBeInTheDocument();
    expect(screen.queryByText("PACE (MIN/KM)")).not.toBeInTheDocument();
    expect(startButton).not.toBeInTheDocument();
  });

  it("shows active running time without elapsed pause duration", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T10:10:00.000Z"));
    useRunningActiveSession.mockReturnValue({
      activeSession: activeSession({
        status: "paused",
        startedAt: "2026-05-12T10:00:00.000Z",
        pausedAt: "2026-05-12T10:06:00.000Z",
        metrics: {
          distanceMeters: 0,
          durationSeconds: 0,
          pausedDurationSeconds: 60,
        },
      }),
    });

    renderPage();

    expect(screen.getAllByText("00:05:00").length).toBeGreaterThan(0);
    expect(screen.queryByText("0:10:00")).not.toBeInTheDocument();
  });

  it("keeps the GPS status pill compact as labels change", async () => {
    renderPage();

    const gpsPill = screen
      .getByText("GPS kutilmoqda")
      .closest('[role="status"]');
    expect(screen.getByTestId("run-map-panel")).toHaveAttribute(
      "data-empty-label",
      "",
    );
    expect(gpsPill).toHaveClass(
      "h-8",
      "w-auto",
      "max-w-full",
      "text-xs",
      "sm:h-11",
      "sm:text-sm",
    );

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
      ).toHaveClass(
        "h-8",
        "w-auto",
        "max-w-full",
        "text-xs",
        "sm:h-11",
        "sm:text-sm",
      );
    });
  });

  it("opens the pause drawer and lets the user continue the run", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));

    expect(
      await screen.findByRole("heading", { name: "Pauzada" }),
    ).toBeInTheDocument();
    expect(finishRunningSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /resume|davom/i }));

    await waitFor(() => {
      expect(resumeRunningSession).toHaveBeenCalledWith("workout-1");
    });
    expect(finishRunningSession).not.toHaveBeenCalled();
  });

  it("warns when browser backgrounding can interrupt live GPS tracking", async () => {
    const visibilitySpy = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");

    try {
      renderPage();

      await act(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /GPS kuzatuvni sekinlashtirishi yoki to'xtatishi mumkin/i,
      );
    } finally {
      visibilitySpy.mockRestore();
    }
  });

  it("finishes a paused run with no local GPS points", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));
    expect(
      await screen.findByRole("heading", { name: "Pauzada" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^yakunlash$/i }));

    await waitFor(() => {
      expect(finishRunningSession).toHaveBeenCalledWith(
        "workout-1",
        expect.objectContaining({
          finalPointSequence: 42,
          finalPoints: [],
          finishedAt: expect.any(String),
        }),
      );
    });
    expect(appendPoints).not.toHaveBeenCalled();
    expect(clearRunningPointQueue).toHaveBeenCalledWith("workout-1");
    expect(await screen.findByText("Workout history detail")).toBeInTheDocument();
  });

  it("finishes a paused run with one local GPS point", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));
    expect(
      await screen.findByRole("heading", { name: "Pauzada" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^yakunlash$/i }));

    await waitFor(() => {
      expect(finishRunningSession).toHaveBeenCalledWith(
        "workout-1",
        expect.objectContaining({
          finalPointSequence: 43,
          finalPoints: [
            expect.objectContaining({
              sequence: 43,
              latitude: 41.311081,
              longitude: 69.240562,
            }),
          ],
          finishedAt: expect.any(String),
        }),
      );
    });
  });

  it("preserves queued GPS points when pre-finish sync fails", async () => {
    appendPoints.mockRejectedValue(new Error("offline"));
    enqueueRunningPoints("workout-1", [
      {
        sequence: 43,
        latitude: 41.311081,
        longitude: 69.240562,
        sourceTimestamp: "2026-05-12T10:01:00.000Z",
      },
    ]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));
    expect(
      await screen.findByRole("heading", { name: "Pauzada" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^yakunlash$/i }));

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
    expect(toast.error).toHaveBeenCalled();
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

    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));
    expect(
      await screen.findByRole("heading", { name: "Pauzada" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^yakunlash$/i }));

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
    await waitFor(() => {
      expect(finishRunningSession).toHaveBeenCalledWith(
        "workout-1",
        expect.objectContaining({
          finalPointSequence: 42,
          finishedAt: expect.any(String),
        }),
      );
    });

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

    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));

    await waitFor(() => {
      expect(pauseRunningSession).toHaveBeenCalledWith("workout-1");
    });
    expect(
      await screen.findByRole("heading", { name: "Pauzada" }),
    ).toBeInTheDocument();
    expect(window.navigator.geolocation.clearWatch).toHaveBeenCalledWith(9);

    fireEvent.click(screen.getByRole("button", { name: /resume|davom/i }));

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

    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));

    await waitFor(() => {
      expect(pauseRunningSession).toHaveBeenCalledWith("workout-1");
    });

    fireEvent.click(screen.getByRole("button", { name: /resume|davom/i }));

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
