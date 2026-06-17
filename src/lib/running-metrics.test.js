import { describe, expect, it } from "vitest";
import {
  calculateLiveRunningActiveDuration,
  calculateLiveRunningMetrics,
  calculateRunningDistanceMeters,
  filterRunningRoutePoints,
  getAcceptedRunningRoutePoints,
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
    expect(metrics.movingDurationSeconds).toBe(420);
    expect(metrics.averagePaceSecondsPerKm).toBeGreaterThan(275);
    expect(metrics.averagePaceSecondsPerKm).toBeLessThan(285);
  });

  it("does not use elapsed duration as moving duration without a live route segment", () => {
    const metrics = calculateLiveRunningMetrics({
      elapsedSeconds: 600,
      points: [
        {
          sequence: 1,
          latitude: 41.311081,
          longitude: 69.240562,
          sourceTimestamp: "2026-05-12T10:00:00.000Z",
        },
      ],
    });

    expect(metrics.distanceMeters).toBe(0);
    expect(metrics.durationSeconds).toBe(600);
    expect(metrics.movingDurationSeconds).toBe(0);
    expect(metrics.averagePaceSecondsPerKm).toBeUndefined();
  });

  it("filters weak GPS noise and does not connect route segments in live metrics", () => {
    const points = [
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
      {
        sequence: 6,
        segmentIndex: 1,
        latitude: 41.7,
        longitude: 69.8,
        accuracy: 8,
        sourceTimestamp: "2026-05-12T10:09:15.000Z",
      },
    ];

    const metrics = calculateLiveRunningMetrics({
      elapsedSeconds: 600,
      points,
    });

    const rejectedReasons = filterRunningRoutePoints(points).rejectedPoints.map(
      (point) => point.rejectionReason,
    );

    expect(metrics.distanceMeters).toBeGreaterThanOrEqual(495);
    expect(metrics.distanceMeters).toBeLessThanOrEqual(505);
    expect(rejectedReasons).toContain("low_accuracy");
    expect(rejectedReasons).toContain("impossible_speed");
  });

  it("excludes stored and current pause time from the live active duration", () => {
    expect(
      calculateLiveRunningActiveDuration("2026-05-12T10:00:00.000Z", {
        now: Date.parse("2026-05-12T10:10:00.000Z"),
        pausedDurationSeconds: 120,
      }),
    ).toBe(480);

    expect(
      calculateLiveRunningActiveDuration("2026-05-12T10:00:00.000Z", {
        now: Date.parse("2026-05-12T10:10:00.000Z"),
        pausedAt: "2026-05-12T10:06:00.000Z",
        pausedDurationSeconds: 60,
      }),
    ).toBe(300);
  });

  it("keeps server-filtered GPS points out of distance and map route points", () => {
    const points = [
      {
        sequence: 1,
        latitude: 41.311081,
        longitude: 69.240562,
        accuracy: 8,
        sourceTimestamp: "2026-05-12T10:00:00.000Z",
      },
      {
        sequence: 2,
        latitude: 42.5,
        longitude: 70.8,
        accuracy: 8,
        isFilteredOut: true,
        rejectionReason: "impossible_speed",
        sourceTimestamp: "2026-05-12T10:01:00.000Z",
      },
      {
        sequence: 3,
        latitude: 41.320081,
        longitude: 69.240562,
        accuracy: 8,
        sourceTimestamp: "2026-05-12T10:10:00.000Z",
      },
    ];

    expect(getAcceptedRunningRoutePoints(points)).toHaveLength(2);
    expect(calculateRunningDistanceMeters(points)).toBeGreaterThan(990);
    expect(calculateRunningDistanceMeters(points)).toBeLessThan(1010);
  });
});
