import { describe, expect, it } from "vitest";
import {
  buildTelegramAttributionProperties,
  parseTelegramCampaignAttribution,
  parseTelegramReferralAttribution,
  resolveTelegramStartParamRoute,
} from "./telegram-start-param.js";

describe("Telegram Mini App start params", () => {
  it("maps supported start_param aliases to user routes", () => {
    expect(resolveTelegramStartParamRoute("dashboard")).toBe(
      "/user/dashboard",
    );
    expect(resolveTelegramStartParamRoute("water")).toBe("/user/water");
    expect(resolveTelegramStartParamRoute("meal_plan")).toBe(
      "/user/nutrition/home",
    );
    expect(resolveTelegramStartParamRoute("workout")).toBe(
      "/user/workout/overview",
    );
    expect(resolveTelegramStartParamRoute("progress")).toBe(
      "/user/measurements",
    );
  });

  it("normalizes attribution properties without leaking connect tokens", () => {
    expect(buildTelegramAttributionProperties("connect_secret-token")).toEqual({
      hasStartParam: true,
      startParam: "connect",
      startParamKind: "connect",
      startParamRoute: null,
    });

    expect(buildTelegramAttributionProperties("meal-plan")).toEqual({
      hasStartParam: true,
      startParam: "meal_plan",
      startParamKind: "meal_plan",
      startParamRoute: "/user/nutrition/home",
    });
  });

  it("extracts campaign job attribution from campaign start params", () => {
    expect(parseTelegramCampaignAttribution("campaign_job-123")).toEqual({
      campaignJobId: "job-123",
      campaignStartParam: "campaign_job-123",
    });

    expect(buildTelegramAttributionProperties("campaign_job-123")).toEqual({
      hasStartParam: true,
      startParam: "campaign_job-123",
      startParamKind: "campaign",
      startParamRoute: null,
      campaignJobId: "job-123",
      campaignStartParam: "campaign_job-123",
    });
  });

  it("extracts referral attribution without changing code separators", () => {
    expect(parseTelegramReferralAttribution("ref_liveon-user1")).toEqual({
      referralCode: "liveon-user1",
      referralStartParam: "ref_liveon-user1",
    });

    expect(buildTelegramAttributionProperties("ref_liveon-user1")).toEqual({
      hasStartParam: true,
      startParam: "ref_liveon-user1",
      startParamKind: "referral",
      startParamRoute: null,
      referralCode: "liveon-user1",
      referralStartParam: "ref_liveon-user1",
    });
  });
});
