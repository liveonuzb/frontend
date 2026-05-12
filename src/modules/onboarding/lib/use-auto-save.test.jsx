import React from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import {
  __resetOnboardingAutoSaveQueuesForTest,
  useOnboardingAutoSave,
} from "./use-auto-save.js";

const putMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/api/use-api.js", () => ({
  default: () => ({
    request: {
      put: putMock,
    },
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
    putMock.mockResolvedValue({});

    const { rerender } = render(
      <AutoSaveProbe step="coach/category" debounceMs={5} type="coach" />,
    );
    rerender(
      <AutoSaveProbe step="coach/experience" debounceMs={5} type="coach" />,
    );
    rerender(
      <AutoSaveProbe step="coach/specialization" debounceMs={5} type="coach" />,
    );

    expect(putMock).not.toHaveBeenCalled();

    await waitFor(() => expect(putMock).toHaveBeenCalledTimes(1));
    expect(putMock.mock.calls[0][1].currentStep).toBe("specialization");
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
});
