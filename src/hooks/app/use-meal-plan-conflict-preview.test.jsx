import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useDeleteQuery: vi.fn(),
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePatchQuery: vi.fn(),
  usePostQuery: vi.fn(),
  usePutQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useQueryClient: vi.fn(),
  };
});

vi.mock("@/hooks/app/use-ai-access", () => ({
  useAiAccessInvalidation: () => ({ invalidateAiAccess: vi.fn() }),
}));

import {
  getMealPlanTemplateConflictPreviewQueryKey,
  useMealPlanTemplateConflictPreview,
} from "./use-meal-plan.js";

describe("useMealPlanTemplateConflictPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          templateId: "template-30",
          isCompatible: false,
          canApply: false,
          canActivate: false,
          blockingReasons: [{ type: "disliked_food", foodId: 12 }],
        },
      },
      isLoading: false,
    });
  });

  it("loads a read-only template conflict preview", () => {
    const { result } = renderHook(() =>
      useMealPlanTemplateConflictPreview("template-30"),
    );

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/meal-plans/templates/template-30/conflicts/preview",
      queryProps: {
        queryKey: getMealPlanTemplateConflictPreviewQueryKey("template-30"),
        enabled: true,
      },
    });
    expect(result.current.preview).toMatchObject({
      templateId: "template-30",
      isCompatible: false,
      canApply: false,
      canActivate: false,
      blockingReasons: [{ type: "disliked_food", foodId: 12 }],
    });
  });

  it("keeps the preview query disabled without a template id", () => {
    renderHook(() => useMealPlanTemplateConflictPreview(null));

    expect(mockUseGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "",
        queryProps: expect.objectContaining({
          enabled: false,
        }),
      }),
    );
  });
});
