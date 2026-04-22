import { describe, expect, it } from "vitest";
import { resolveCoachClientDetailPayload } from "./use-coach-clients.js";

describe("resolveCoachClientDetailPayload", () => {
  it("unwraps the API envelope used by coach client detail responses", () => {
    const detail = resolveCoachClientDetailPayload({
      data: {
        data: {
          client: {
            id: "client-1",
            name: "Fazliddin Liveon",
          },
          overview: {
            healthGoals: {
              calories: 2564,
            },
          },
          dailyLogs: [{ id: "log-1" }],
        },
        meta: {
          timestamp: "2026-04-22T06:26:55.319Z",
        },
      },
    });

    expect(detail.client).toEqual({
      id: "client-1",
      name: "Fazliddin Liveon",
    });
    expect(detail.overview.healthGoals.calories).toBe(2564);
    expect(detail.dailyLogs).toEqual([{ id: "log-1" }]);
    expect(detail.measurements).toEqual([]);
  });
});
