import { describe, expect, it } from "vitest";
import {
  resolveCoachClientDetailPayload,
  resolveCoachClientSummaryPayload,
  resolveCoachPackagesPayload,
} from "./use-coach-clients.js";

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

describe("resolveCoachClientSummaryPayload", () => {
  it("unwraps the API envelope used by coach client summary responses", () => {
    const summary = resolveCoachClientSummaryPayload({
      data: {
        data: {
          clientId: "client-1",
          risk: { score: 60, level: "medium" },
          commandCenter: {
            telegram: { connected: true, username: "clientone" },
          },
        },
      },
    });

    expect(summary.clientId).toBe("client-1");
    expect(summary.risk.level).toBe("medium");
    expect(summary.commandCenter.telegram.username).toBe("clientone");
  });
});

describe("resolveCoachPackagesPayload", () => {
  it("unwraps coach package list envelopes", () => {
    const packages = resolveCoachPackagesPayload({
      data: {
        data: {
          items: [
            {
              id: "package-1",
              name: "Premium",
              billingCycle: "monthly",
            },
          ],
        },
      },
    });

    expect(packages).toHaveLength(1);
    expect(packages[0].name).toBe("Premium");
  });
});
