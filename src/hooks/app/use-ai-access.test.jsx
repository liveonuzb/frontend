import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

import {
  AI_USAGE_FEATURES,
  AI_USAGE_STATUS_QUERY_KEY,
  getAiAccessStatus,
  getAiUsageFeatureOptions,
  isAiAccessLimitError,
  normalizeAiAccessStatusForTest,
  useAiAccessInvalidation,
  useAiAccessStatus,
} from "./use-ai-access.js";

describe("AI access normalization", () => {
  it("normalizes premium unlimited status", () => {
    const access = normalizeAiAccessStatusForTest({
      data: {
        data: {
          isPremium: true,
          status: "premium_unlimited",
          dailyLimit: null,
          remainingToday: null,
        },
      },
    });

    expect(access).toMatchObject({
      isPremium: true,
      status: "premium_unlimited",
      dailyLimit: null,
      remainingToday: null,
      isLimited: false,
    });
    expect(getAiAccessStatus({ access }).label).toBe("Cheksiz AI");
  });

  it("normalizes trial quota status", () => {
    const access = normalizeAiAccessStatusForTest({
      status: "trial_active",
      dailyLimit: "3",
      usedToday: 1,
      reservedToday: "1",
      remainingToday: "1",
      timezone: "Asia/Tashkent",
      localDate: "2026-05-24",
    });

    expect(access).toMatchObject({
      status: "trial_active",
      dailyLimit: 3,
      usedToday: 1,
      reservedToday: 1,
      remainingToday: 1,
      isTrialActive: true,
      isLimited: false,
    });
    expect(getAiAccessStatus({ access }).label).toBe("Bugun 1/3 qoldi");
  });

  it("disables access when trial is expired or daily quota is exhausted", () => {
    expect(
      getAiAccessStatus({
        access: { status: "trial_expired", remainingToday: 0, dailyLimit: 3 },
      }),
    ).toMatchObject({
      isDisabled: true,
      label: "Limit tugadi",
    });

    expect(
      getAiAccessStatus({
        access: { status: "trial_active", remainingToday: 0, dailyLimit: 3 },
      }),
    ).toMatchObject({
      isDisabled: true,
      label: "Bugun 0/3 qoldi",
    });
  });

  it("detects AI access limit errors", () => {
    expect(
      isAiAccessLimitError({
        response: { status: 402, data: { code: "AI_DAILY_LIMIT_REACHED" } },
      }),
    ).toBe(true);
    expect(isAiAccessLimitError({ status: 402, code: "AI_TRIAL_EXPIRED" })).toBe(
      true,
    );
    expect(isAiAccessLimitError({ status: 402, code: "PAYMENT_REQUIRED" })).toBe(
      false,
    );
  });

  it("exposes supported feature options", () => {
    expect(getAiUsageFeatureOptions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: AI_USAGE_FEATURES.foodPhotoScan,
          label: "Food photo scan",
        }),
      ]),
    );
  });
});

describe("AI access hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the status endpoint and stable query key", () => {
    mockUseGetQuery.mockReturnValue({ data: { data: {} }, isLoading: false });

    renderHook(() => useAiAccessStatus());

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/ai-usage/status",
      queryProps: {
        queryKey: AI_USAGE_STATUS_QUERY_KEY,
        enabled: true,
      },
    });
  });

  it("invalidates AI usage status", async () => {
    const { result } = renderHook(() => useAiAccessInvalidation());

    await result.current.invalidateAiAccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: AI_USAGE_STATUS_QUERY_KEY,
    });
  });
});
