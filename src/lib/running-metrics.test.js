import { describe, expect, it } from "vitest";
import {
  calculateLiveRunningMetrics,
  calculateRunningDistanceMeters,
} from "./running-metrics.js";

describe("running metrics", () => {
  it("calculates live distance from ordered GPS points", () => {
    const distanceMeters = calculateRunningDistanceMeters([
      {
        sequence: 2,
        latitude: 41.320081,
        longitude: 69.240562,
        sourceTimestamp: "2026-05-12T10:02:00.000Z",
      },
      {
        sequence: 1,
        latitude: 41.311081,
        longitude: 69.240562,
        sourceTimestamp: "2026-05-12T10:00:00.000Z",
      },
    ]);

    expect(distanceMeters).toBeGreaterThan(990);
    expect(distanceMeters).toBeLessThan(1010);
  });

  it("combines server baseline metrics with local live segment metrics", () => {
    const metrics = calculateLiveRunningMetrics({
      baseMetrics: {
        distanceMeters: 500,
        durationSeconds: 300,
      },
      elapsedSeconds: 600,
      points: [
        {
          sequence: 1,
          latitude: 41.311081,
          longitude: 69.240562,
          sourceTimestamp: "2026-05-12T10:00:00.000Z",
        },
        {
          sequence: 2,
          latitude: 41.320081,
          longitude: 69.240562,
          sourceTimestamp: "2026-05-12T10:02:00.000Z",
        },
      ],
    });

    expect(metrics.distanceMeters).toBeGreaterThan(1490);
    expect(metrics.durationSeconds).toBe(600);
    expect(metrics.averagePaceSecondsPerKm).toBeGreaterThan(390);
    expect(metrics.averagePaceSecondsPerKm).toBeLessThan(410);
  });

  it("filters weak GPS noise and does not connect route segments in live metrics", () => {
    const metrics = calculateLiveRunningMetrics({
      elapsedSeconds: 600,
      points: [
        {
          sequence: 1,
          segmentIndex: 0,
          latitude: 41.311081,
          longitude: 69.240562,
          accuracy: 8,
          sourceTimestamp: "2026-05-12T10:00:00.000Z",
        },
        {
          sequence: 2,
          segmentIndex: 0,
          latitude: 41.31109,
          longitude: 69.240562,
          accuracy: 8,
          sourceTimestamp: "2026-05-12T10:00:05.000Z",
        },
        {
          sequence: 3,
          segmentIndex: 1,
          latitude: 41.315575,
          longitude: 69.240562,
          accuracy: 8,
          sourceTimestamp: "2026-05-12T10:04:00.000Z",
        },
        {
          sequence: 4,
          segmentIndex: 1,
          latitude: 41.320069,
          longitude: 69.240562,
          accuracy: 8,
          sourceTimestamp: "2026-05-12T10:09:00.000Z",
        },
        {
          sequence: 5,
          segmentIndex: 1,
          latitude: 41.7,
          longitude: 69.8,
          accuracy: 150,
          sourceTimestamp: "2026-05-12T10:09:10.000Z",
        },
      ],
    });

    expect(metrics.distanceMeters).toBeGreaterThanOrEqual(495);
    expect(metrics.distanceMeters).toBeLessThanOrEqual(505);
  });
});
