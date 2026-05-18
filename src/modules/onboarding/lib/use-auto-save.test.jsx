import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import {
  __resetOnboardingAutoSaveQueuesForTest,
  useOnboardingAutoSave,
} from "./use-auto-save.js";

const putMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/api", () => ({
  usePutQuery: () => ({
    mutateAsync: putMock,
  }),
}));

const AutoSaveProbe = ({ step = "name", debounceMs = 1, type = "user" }) => {
  useOnboardingAutoSave(type, step, { debounceMs });
  return null;
};

describe("useOnboardingAutoSave", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
    __resetOnboardingAutoSaveQueuesForTest();
    putMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetOnboardingAutoSaveQueuesForTest();
  });

  it("stores a visible error state when draft save fails", async () => {
    putMock.mockRejectedValueOnce(new Error("Network failed"));

    render(<AutoSaveProbe />);

    await waitFor(() => {
      expect(useOnboardingStore.getState().draftSaveStatus).toBe("error");
    });
    expect(useOnboardingStore.getState().draftSaveError).toBe("Network failed");
  });

  it("coalesces rapid step changes into one draft save", async () => {
    vi.useFakeTimers();
    putMock.mockResolvedValue({});

    const { rerender } = render(<AutoSaveProbe step="user/name" debounceMs={5} />);
    rerender(<AutoSaveProbe step="user/age" debounceMs={5} />);
    rerender(<AutoSaveProbe step="user/goal" debounceMs={5} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4);
    });
    expect(putMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock.mock.calls[0][0].attributes.currentStep).toBe("user/goal");
  });

  it("backs off and retries once when draft save is rate limited", async () => {
    putMock
      .mockRejectedValueOnce({
        response: { status: 429, headers: { "retry-after": "0.2" } },
      })
      .mockResolvedValueOnce({});

    render(<AutoSaveProbe debounceMs={5} />);

    await waitFor(() => expect(putMock).toHaveBeenCalledTimes(1));
    expect(useOnboardingStore.getState().draftSaveStatus).toBe("error");
    expect(useOnboardingStore.getState().draftSaveError).toContain(
      "retrying shortly",
    );

    await waitFor(() => expect(putMock).toHaveBeenCalledTimes(2));
    expect(useOnboardingStore.getState().draftSaveStatus).toBe("saved");
  });

  it("saves only active user onboarding draft fields", async () => {
    putMock.mockResolvedValue({});
    useOnboardingStore.getState().setFields({
      firstName: "Ali",
      mealFrequency: "3",
      completedUserOnboardingSteps: ["other-goals"],
      weeklyWorkoutCount: 4,
      workoutExperience: "advanced",
      foodBudgetTier: "high",
      preferredCuisineIds: ["uzbek"],
      workoutLocation: "gym",
    });

    render(<AutoSaveProbe debounceMs={1} />);

    await waitFor(() => expect(putMock).toHaveBeenCalledTimes(1));
    const payload = putMock.mock.calls[0][0].attributes.data;

    expect(payload).toMatchObject({
      firstName: "Ali",
      mealFrequency: "3",
      completedUserOnboardingSteps: ["other-goals"],
    });
    expect(payload).not.toHaveProperty("weeklyWorkoutCount");
    expect(payload).not.toHaveProperty("workoutExperience");
    expect(payload).not.toHaveProperty("foodBudgetTier");
    expect(payload).not.toHaveProperty("preferredCuisineIds");
    expect(payload).not.toHaveProperty("workoutLocation");
  });
});
