import { describe, expect, it } from "vitest";
import {
  RUNNING_POINT_BATCH_MAX_SIZE,
  RUNNING_POINT_QUEUE_MAX_SIZE,
  buildRunningPointBatch,
  computeRunningSyncBackoffMs,
  dedupeRunningPoints,
  parseRetryAfterMs,
  trimRunningPointQueue,
} from "./running-point-sync.js";

const point = (sequence) => ({
  sequence,
  latitude: 41 + sequence / 1000,
  longitude: 69,
  sourceTimestamp: `2026-05-12T10:00:${String(sequence).padStart(2, "0")}.000Z`,
});

describe("running point sync utilities", () => {
  it("dedupes by numeric sequence and keeps the latest valid point ordering", () => {
    expect(
      dedupeRunningPoints([point(2), point(1), point(2), point(3)]),
    ).toEqual([point(1), point(2), point(3)]);
  });

  it("drops invalid points before batching", () => {
    expect(
      dedupeRunningPoints([
        point(1),
        { sequence: 0, latitude: 41, longitude: 69 },
        { sequence: 2, latitude: Number.NaN, longitude: 69 },
        { sequence: 3, latitude: 41, longitude: undefined },
      ]),
    ).toEqual([point(1)]);
  });

  it("caps the persisted queue to the newest allowed points", () => {
    const manyPoints = Array.from(
      { length: RUNNING_POINT_QUEUE_MAX_SIZE + 5 },
      (_, index) => point(index + 1),
    );

    const capped = trimRunningPointQueue(manyPoints);

    expect(capped).toHaveLength(RUNNING_POINT_QUEUE_MAX_SIZE);
    expect(capped[0].sequence).toBe(6);
    expect(capped.at(-1).sequence).toBe(RUNNING_POINT_QUEUE_MAX_SIZE + 5);
  });

  it("builds one upload batch from the oldest queued points", () => {
    const points = Array.from(
      { length: RUNNING_POINT_BATCH_MAX_SIZE + 3 },
      (_, index) => point(index + 1),
    );

    const batch = buildRunningPointBatch(points);

    expect(batch).toHaveLength(RUNNING_POINT_BATCH_MAX_SIZE);
    expect(batch[0].sequence).toBe(1);
    expect(batch.at(-1).sequence).toBe(RUNNING_POINT_BATCH_MAX_SIZE);
  });

  it("parses retry-after headers in seconds and milliseconds", () => {
    expect(parseRetryAfterMs({ "retry-after": "2" })).toBe(2000);
    expect(parseRetryAfterMs({ "retry-after-short": "1" })).toBe(1000);
    expect(parseRetryAfterMs({ "retry-after": "bad" })).toBe(null);
  });

  it("computes bounded exponential backoff with retry-after priority", () => {
    expect(computeRunningSyncBackoffMs({ failureCount: 1 })).toBe(1000);
    expect(computeRunningSyncBackoffMs({ failureCount: 3 })).toBe(4000);
    expect(
      computeRunningSyncBackoffMs({
        failureCount: 3,
        headers: { "retry-after": "7" },
      }),
    ).toBe(7000);
  });
});
