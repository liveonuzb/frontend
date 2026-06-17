import { beforeEach, describe, expect, it, vi } from "vitest";
import { RUNNING_POINT_QUEUE_MAX_SIZE } from "./running-point-sync.js";
import {
  clearRunningPointQueue,
  enqueueRunningPoints,
  loadRunningPointQueue,
} from "./running-offline-queue.js";

import map from "lodash/map";

const point = (sequence) => ({
  sequence,
  segmentIndex: 0,
  latitude: 41 + sequence / 1000,
  longitude: 69,
  sourceTimestamp: `2026-05-12T10:00:${String(sequence % 60).padStart(2, "0")}.000Z`,
});

describe("running offline queue", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("dedupes queued points by sequence", () => {
    enqueueRunningPoints("workout-1", [point(1), point(2)]);
    enqueueRunningPoints("workout-1", [point(2), point(3)]);

    expect(
      map(loadRunningPointQueue("workout-1"), (item) => item.sequence),
    ).toEqual([1, 2, 3]);
  });

  it("caps the queue to the newest allowed points", () => {
    enqueueRunningPoints(
      "workout-1",
      Array.from({ length: RUNNING_POINT_QUEUE_MAX_SIZE + 2 }, (_, index) =>
        point(index + 1),
      ),
    );

    const queue = loadRunningPointQueue("workout-1");

    expect(queue).toHaveLength(RUNNING_POINT_QUEUE_MAX_SIZE);
    expect(queue[0].sequence).toBe(3);
  });

  it("clears one workout queue without clearing another", () => {
    enqueueRunningPoints("workout-1", [point(1)]);
    enqueueRunningPoints("workout-2", [point(2)]);

    clearRunningPointQueue("workout-1");

    expect(loadRunningPointQueue("workout-1")).toEqual([]);
    expect(
      map(loadRunningPointQueue("workout-2"), (item) => item.sequence),
    ).toEqual([2]);
  });

  it("does not crash when localStorage quota blocks queue writes", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

    expect(() => enqueueRunningPoints("workout-1", [point(1)])).not.toThrow();
    expect(enqueueRunningPoints("workout-1", [point(1)])).toEqual([point(1)]);

    setItem.mockRestore();
  });
});
