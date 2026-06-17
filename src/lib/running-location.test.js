import { describe, expect, it } from "vitest";
import {
  RUNNING_LOCATION_ERROR,
  buildRunningPointFromPosition,
  getRunningLocationErrorStatus,
  isUsableRunningPosition,
} from "./running-location.js";

describe("running location", () => {
  it("builds API running points with named latitude and longitude fields", () => {
    const point = buildRunningPointFromPosition(
      {
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
          altitude: 420,
          accuracy: 8,
          speed: 2.4,
          heading: 180,
        },
        timestamp: Date.parse("2026-05-12T10:00:00.000Z"),
      },
      { sequence: 7, segmentIndex: 2 },
    );

    expect(point).toEqual({
      sequence: 7,
      segmentIndex: 2,
      latitude: 41.311081,
      longitude: 69.240562,
      altitude: 420,
      accuracy: 8,
      speed: 2.4,
      heading: 180,
      sourceTimestamp: "2026-05-12T10:00:00.000Z",
    });
  });

  it("classifies weak GPS positions without rejecting missing accuracy", () => {
    expect(
      isUsableRunningPosition({ coords: { accuracy: 76 } }),
    ).toBe(false);
    expect(isUsableRunningPosition({ coords: { accuracy: 75 } })).toBe(true);
    expect(isUsableRunningPosition({ coords: {} })).toBe(true);
    expect(getRunningLocationErrorStatus({ code: "weak" })).toBe(
      RUNNING_LOCATION_ERROR.weak,
    );
  });
});
