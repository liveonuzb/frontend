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
  AI_CREDIT_COSTS_QUERY_KEY,
  AI_CREDIT_FEATURES,
  AI_CREDIT_WALLET_QUERY_KEY,
  getAiCreditFeatureLabel,
  getAiCreditStatus,
  normalizeAiCreditCostsForTest,
  normalizeAiCreditWalletForTest,
  useAiCreditCosts,
  useAiCreditInvalidation,
  useAiCreditWallet,
} from "./use-ai-credits.js";

describe("AI credit normalization", () => {
  it("normalizes wallet fields from wrapped backend data", () => {
    const wallet = normalizeAiCreditWalletForTest({
      data: {
        data: {
          monthlyGrant: "300",
          used: 11,
          reserved: "4",
          remaining: "285",
          resetsAt: "2026-06-01T00:00:00.000Z",
          tier: "premium",
        },
      },
    });

    expect(wallet).toMatchObject({
      monthlyGrant: 300,
      used: 11,
      reserved: 4,
      remaining: 285,
      resetsAt: "2026-06-01T00:00:00.000Z",
      tier: "premium",
      isPremium: true,
      isExhausted: false,
    });
  });

  it("derives remaining credits and defaults missing wallet data", () => {
    const wallet = normalizeAiCreditWalletForTest({
      monthlyGrant: 20,
      used: 18,
      reserved: 1,
    });

    expect(wallet).toMatchObject({
      monthlyGrant: 20,
      used: 18,
      reserved: 1,
      remaining: 1,
      resetsAt: null,
      tier: null,
      isPremium: false,
      isExhausted: false,
    });
  });

  it("normalizes costs and preserves supported feature constants", () => {
    const costs = normalizeAiCreditCostsForTest({
      costs: {
        TEXT_MEAL_LOG: "1",
        FOOD_PHOTO_SCAN: 2,
        MEAL_PLAN_30_DAY: "10",
      },
    });

    expect(costs).toMatchObject({
      [AI_CREDIT_FEATURES.textMealLog]: 1,
      [AI_CREDIT_FEATURES.voiceMealLog]: null,
      [AI_CREDIT_FEATURES.foodPhotoScan]: 2,
      [AI_CREDIT_FEATURES.mealPlan7Day]: null,
      [AI_CREDIT_FEATURES.mealPlan30Day]: 10,
      [AI_CREDIT_FEATURES.nutritionAnalysis]: null,
    });
  });

  it("reports disabled status when remaining credits are below feature cost", () => {
    const status = getAiCreditStatus({
      wallet: { remaining: 1 },
      costs: { [AI_CREDIT_FEATURES.foodPhotoScan]: 2 },
      feature: AI_CREDIT_FEATURES.foodPhotoScan,
    });

    expect(status).toEqual({
      cost: 2,
      remaining: 1,
      isExhausted: false,
      isDisabled: true,
      label: "Food photo scan",
      reason: "AI credits exhausted",
    });
  });

  it("returns readable labels for all supported features", () => {
    expect(getAiCreditFeatureLabel(AI_CREDIT_FEATURES.textMealLog)).toBe(
      "Text meal log",
    );
    expect(getAiCreditFeatureLabel(AI_CREDIT_FEATURES.voiceMealLog)).toBe(
      "Voice meal log",
    );
    expect(getAiCreditFeatureLabel(AI_CREDIT_FEATURES.foodPhotoScan)).toBe(
      "Food photo scan",
    );
    expect(getAiCreditFeatureLabel(AI_CREDIT_FEATURES.mealPlan7Day)).toBe(
      "7-day meal plan",
    );
    expect(getAiCreditFeatureLabel(AI_CREDIT_FEATURES.mealPlan30Day)).toBe(
      "30-day meal plan",
    );
    expect(getAiCreditFeatureLabel(AI_CREDIT_FEATURES.nutritionAnalysis)).toBe(
      "Nutrition analysis",
    );
  });
});

describe("AI credit hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses stable query keys for wallet and costs endpoints", () => {
    mockUseGetQuery.mockReturnValue({ data: { data: {} }, isLoading: false });

    renderHook(() => useAiCreditWallet());
    renderHook(() => useAiCreditCosts());

    expect(mockUseGetQuery).toHaveBeenNthCalledWith(1, {
      url: "/user/ai-credits/me",
      queryProps: {
        queryKey: AI_CREDIT_WALLET_QUERY_KEY,
        enabled: true,
      },
    });
    expect(mockUseGetQuery).toHaveBeenNthCalledWith(2, {
      url: "/user/ai-credits/costs",
      queryProps: {
        queryKey: AI_CREDIT_COSTS_QUERY_KEY,
        enabled: true,
      },
    });
  });

  it("invalidates wallet and costs queries together", async () => {
    const { result } = renderHook(() => useAiCreditInvalidation());

    await result.current.invalidateAiCredits();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: AI_CREDIT_WALLET_QUERY_KEY,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: AI_CREDIT_COSTS_QUERY_KEY,
    });
  });
});
