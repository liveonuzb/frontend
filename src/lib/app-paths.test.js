import { describe, expect, it } from "vitest";
import {
  canAccessUserDashboard,
  getPostOnboardingPath,
  ONBOARDING_FLOW_STATUS,
} from "./app-paths.js";

describe("post-onboarding route resolution", () => {
  it("keeps users on the correct post-onboarding status route after auth refresh", () => {
    expect(
      getPostOnboardingPath({
        onboardingFlowStatus: ONBOARDING_FLOW_STATUS.personalizing,
        latestPersonalizationJobId: "metabolism-1",
      }),
    ).toBe("/user/onboarding/metabolism-calculating/metabolism-1");

    expect(
      getPostOnboardingPath({
        onboardingFlowStatus: ONBOARDING_FLOW_STATUS.personalizationFailed,
        latestPersonalizationJobId: "failed-1",
      }),
    ).toBe("/user/onboarding/metabolism-calculating/failed-1");

    expect(
      getPostOnboardingPath({
        onboardingFlowStatus: ONBOARDING_FLOW_STATUS.personalizationReady,
      }),
    ).toBe("/user/onboarding/metabolism-result");

    expect(
      getPostOnboardingPath({
        onboardingFlowStatus: ONBOARDING_FLOW_STATUS.resultConfirmed,
      }),
    ).toBe("/user/onboarding/plan-generating");

    expect(
      getPostOnboardingPath({
        onboardingFlowStatus: ONBOARDING_FLOW_STATUS.planGenerating,
        latestPlanGenerationJobId: "plan-1",
      }),
    ).toBe("/user/onboarding/plan-generating/plan-1");

    expect(
      getPostOnboardingPath({
        onboardingFlowStatus: ONBOARDING_FLOW_STATUS.planFailed,
        latestPlanGenerationJobId: "plan-failed",
      }),
    ).toBe("/user/onboarding/plan-generating/plan-failed");

    expect(
      getPostOnboardingPath({
        onboardingFlowStatus: ONBOARDING_FLOW_STATUS.planReady,
      }),
    ).toBe("/user/onboarding/plan-ready");
  });

  it("uses nested onboarding status fields from a refreshed user payload", () => {
    expect(
      getPostOnboardingPath({
        onboarding: {
          flowStatus: ONBOARDING_FLOW_STATUS.planGenerating,
          latestPlanGenerationJobId: "nested-plan",
        },
      }),
    ).toBe("/user/onboarding/plan-generating/nested-plan");
  });

  it("does not loop completed seeded users back to onboarding when status is draft", () => {
    expect(canAccessUserDashboard(ONBOARDING_FLOW_STATUS.draft, true)).toBe(
      true,
    );
    expect(
      getPostOnboardingPath({
        onboardingCompleted: true,
        onboardingFlowStatus: ONBOARDING_FLOW_STATUS.draft,
      }),
    ).toBe("/user");
  });
});
