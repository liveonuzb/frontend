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
        sourceTimestamp: "2026-05-12T10:01:00.000Z",
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
          sourceTimestamp: "2026-05-12T10:01:00.000Z",
        },
      ],
    });

    expect(metrics.distanceMeters).toBeGreaterThan(1490);
    expect(metrics.durationSeconds).toBe(600);
    expect(metrics.averagePaceSecondsPerKm).toBeGreaterThan(390);
    expect(metrics.averagePaceSecondsPerKm).toBeLessThan(410);
  });
});
