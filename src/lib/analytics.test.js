import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLaunchAnalyticsPayload,
  getLaunchSessionId,
  rememberTelegramCampaignAttribution,
  trackCampaignConversion,
  trackLaunchEvent,
} from "./analytics.js";

describe("launch analytics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.replaceState({}, "", "/landing?utm_source=test");
  });

  it("keeps a stable anonymous launch session id", () => {
    const first = getLaunchSessionId();
    const second = getLaunchSessionId();

    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  it("builds a normalized payload for funnel events", () => {
    const payload = buildLaunchAnalyticsPayload("hero_cta_clicked", {
      source: "landing",
      properties: { language: "uz" },
    });

    expect(payload).toMatchObject({
      eventName: "hero_cta_clicked",
      source: "landing",
      path: "/landing?utm_source=test",
      properties: { language: "uz" },
    });
    expect(payload.sessionId).toBeTruthy();
  });

  it("posts analytics events without blocking the user flow", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("network"));

    await expect(
      trackLaunchEvent("premium_checkout_opened", {
        source: "premium",
        properties: { plan: "monthly" },
      }),
    ).resolves.toBe(false);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/analytics/events",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("premium_checkout_opened"),
      }),
    );
  });

  it("remembers Telegram campaign attribution and posts conversion events", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true });

    expect(rememberTelegramCampaignAttribution("campaign_job-123")).toEqual(
      expect.objectContaining({
        campaignJobId: "job-123",
        campaignStartParam: "campaign_job-123",
      }),
    );

    await expect(
      trackCampaignConversion("water_log", { date: "2026-05-19" }),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/analytics/events",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("campaign_conversion"),
      }),
    );
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toMatchObject({
      eventName: "campaign_conversion",
      source: "telegram",
      properties: {
        campaignJobId: "job-123",
        campaignStartParam: "campaign_job-123",
        conversionType: "water_log",
        date: "2026-05-19",
      },
    });
  });
});
